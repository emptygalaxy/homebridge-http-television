import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {Logger} from 'homebridge/lib/logger';
import {HttpTelevisionPlatform} from './HttpTelevisionPlatform';
import {TelevisionHandler} from './TelevisionHandler';
import {InformationHandler} from './InformationHandler';
import {InputSourceHandler} from './InputSourceHandler';
import {TelevisionSpeakerHandler} from './TelevisionSpeakerHandler';
import {HttpTelevision} from "http-television";
import {HttpTelevisionAccessoryConfig} from "./HttpTelevisionPluginConfig";
import {API} from 'homebridge/lib/api';

export class HttpTelevisionPlatformAccessory {
    private readonly name: string;

    private readonly enableSwitch: boolean;
    private readonly enableSpeaker: boolean;

    private readonly television: HttpTelevision;

    private readonly informationHandler: InformationHandler;
    private readonly tvHandler: TelevisionHandler;
    private readonly inputsHandler: InputSourceHandler;
    private readonly speakerHandler?: TelevisionSpeakerHandler;

    public constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly config: HttpTelevisionAccessoryConfig,
        private readonly platform: HttpTelevisionPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        // handle config
        const c = config;

        this.name = c.name || 'Http Television';
        this.enableSwitch = c.enableSwitch || false;
        this.enableSpeaker = c.enableSpeaker || false;

        // set category
        this.accessory.category = c.category === 'television' ? this.api.hap.Categories.TELEVISION : this.api.hap.Categories.TV_SET_TOP_BOX;

        this.television = new HttpTelevision(this.config);

        // handlers
        this.tvHandler = new TelevisionHandler(this.log, this.api, this.accessory, this.television, this.name, this.enableSwitch);
        this.informationHandler = new InformationHandler(this.log, this.api, this.accessory, config);
        this.inputsHandler = new InputSourceHandler(this.log, this.api, this.accessory, this.television, config, this.tvHandler.getService());
        // if(this.enableSpeaker) {
        //     this.speakerHandler = new TelevisionSpeakerHandler(this.log, this.api, this.accessory, this.television,
        //         this.tvHandler.getService(), this.name);
        // }

        // console.dir(this.accessory.context);
        log.info('finished initializing!');
    }

    /**
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     * @returns Service[]
     */
    getServices(): any[] {
        // return this.availableServices;
        let services: any[] = [
            this.informationHandler.getService(),
            this.tvHandler.getService(),
        ];

        if(this.speakerHandler) {
            services.push(this.speakerHandler.getService());
        }

        const switchService = this.tvHandler.getSwitchService();
        if(switchService) {
            services.push(switchService);
        }

        services = services.concat(this.inputsHandler.getServices());

        return services;
    }
}