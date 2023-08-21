import { GlobalAPI } from "src/types/global-api";
import { initGlobalAPI } from "./global-api";
import Vue from "./instance";

initGlobalAPI(Vue as unknown as GlobalAPI);

export default Vue;
