import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  utils,
} from "@builderbot/bot";
import { MemoryDB as Database } from "@builderbot/bot";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import { EVENTS } from "@builderbot/bot";
import { getMenu } from "./mysql/fetchData.cjs";
import { getDescription } from "./mysql/fetchImages.cjs";

const PORT = process.env.PORT ?? 3008;

const flowBienvenida = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { flowDynamic, gotoFlow, state }) => {
    const response = ctx.body;
    const data = state.getMyState();
    if (!data) {
      await state.update({ start: 1 });
      return gotoFlow(flowMenu);
    }else{
        return gotoFlow(flowValidate)
    }
  }
);

const flowMenu = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { flowDynamic, gotoFlow }) => {
    const data = await getMenu();

    const inicio = data.mensaje_init;

    const options = data.menu;
    const menu = options;

    let msg = `${inicio.content}\n\n`;
    let ban = 1;
    menu.map((item) => {
      msg += `*${ban}*> *${item.name}*\n`;
      ban +=1
    });

    if (!inicio.path_media) {
      await flowDynamic([{ body: msg }]);
    } else {
      await flowDynamic([{ body: msg, media: inicio.path_media }]);
    }
    return gotoFlow(flowValidate);
  }
);

const flowValidate = addKeyword(EVENTS.ACTION).addAction(
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow,state }) => {
    const option = ctx.body;

    const data = await getMenu();

    const options = data.menu;
    const menu = options;
    let ban = 1;
    let validate = false;
    let id;
    menu.map((item) => {
      if (ban == option) {
        validate = true;
        id = item.id;
        
      }
      ban +=1
    });
    await state.update({option:id})
    if (!validate) {
      await flowDynamic("*Seleccion una opcion valida*\n\n");
      return gotoFlow(flowMenu);
    } else {
      return gotoFlow(flowImages)
    }
  }
);


const flowImages = addKeyword(EVENTS.ACTION).addAction(async(ctx,{flowDynamic,gotoFlow,state})=>{
const estado = await state.getMyState()

const option = estado.option
const data = await getDescription(option)

let msg = `${data.option.name}\n\n*${data.option.description}*`
let images = data.images

let validate = false
if(images.length>0){
  
    images.map(async(item,index)=>{
        if(index==0){
            await flowDynamic([{body:msg, media:item.urlPath}])
            validate = true
            msg = ""
            console.log(msg)
            
        }else{
            await  flowDynamic([{media:item.urlPath}])
        }
    }) 

}else{
    await flowDynamic([{body:msg}])
}

return gotoFlow(flowValidate)
})


const main = async () => {
  const adapterFlow = createFlow([flowBienvenida, flowValidate, flowMenu,flowImages]);

  const adapterProvider = createProvider(Provider);
  const adapterDB = new Database();

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  httpServer(+PORT);
};

main();
