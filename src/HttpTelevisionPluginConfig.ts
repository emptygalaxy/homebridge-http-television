import {HttpTelevisionConfig} from "http-television/dist";
// import {PlatformConfig} from "homebridge/lib/server";

export interface HttpTelevisionPluginConfig {
    // name: string;
    televisions: HttpTelevisionAccessoryConfig[];
}

export interface HttpTelevisionAccessoryConfig extends HttpTelevisionConfig {
    id?: string;
    name: string;

    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    version?: string;

    enableSwitch?: boolean;
    enableSpeaker?: boolean;
    category?: 'television'|'top set box';
}