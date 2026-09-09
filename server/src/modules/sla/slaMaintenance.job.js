import logger from "../../config/logger.js";
import service from "./sla.service.js";
import { SLA_DEFAULTS } from "./sla.constants.js";
let timer=null,busy=false;
export function startSlaMaintenanceJob({intervalMs=SLA_DEFAULTS.MAINTENANCE_INTERVAL_MS}={}){
    if(timer)return;
    timer=setInterval(async()=>{if(busy)return;busy=true;try{await service.maintenance();}catch(error){logger.error("SLA maintenance job failed.",{error:error.message,stack:error.stack});}finally{busy=false;}},intervalMs);
    timer.unref?.();
    logger.info("SLA maintenance job started.",{intervalMs});
}
export function stopSlaMaintenanceJob(){if(timer){clearInterval(timer);timer=null;busy=false;logger.info("SLA maintenance job stopped.");}}
export default Object.freeze({startSlaMaintenanceJob,stopSlaMaintenanceJob});
