import {APIEvent, DynamicPlatformPlugin, API} from 'homebridge/lib/api';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {Logger} from 'homebridge/lib/logger';
import {PlatformConfig} from 'homebridge/lib/server';
import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {HttpTelevisionAccessoryConfig, HttpTelevisionPluginConfig} from "./HttpTelevisionPluginConfig";
import {HttpTelevisionPlatformAccessory} from "./HttpTelevisionPlatformAccessory";

export class HttpTelevisionPlatform implements DynamicPlatformPlugin {
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.log.debug('Load PJLink accessories');

            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory): void {
        this.accessories.push(accessory);
    }

    discoverDevices(): void {
        const c: HttpTelevisionPluginConfig = this.config as HttpTelevisionPluginConfig;

        const retiredAccessories = this.accessories.slice();

        const devices = c.televisions;
        if(devices) {
            devices.forEach((tvConfig: HttpTelevisionAccessoryConfig) => {
                const name: string = tvConfig.name;

                // use identifier or name
                const id: string = tvConfig.id || name;
                const uuid = this.api.hap.uuid.generate(id);

                const existingAccessory = this.accessories.find(accesory => accesory.UUID === uuid);
                if(existingAccessory) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName, uuid);

                    new HttpTelevisionPlatformAccessory(this.log, this.api, tvConfig, this, existingAccessory);
                    this.api.updatePlatformAccessories([existingAccessory]);

                    // remove from retired devices
                    const retiredIndex = retiredAccessories.indexOf(existingAccessory);
                    if(retiredIndex > -1) {
                        retiredAccessories.splice(retiredIndex, 1);
                    }
                } else {
                    // console.log('new accessory', name, uuid);
                    if(!name || name === '') {
                        this.log.error('PJLink device must be created with a non-empty name');
                    } else {
                        const accessory = new this.api.platformAccessory(name, uuid);
                        accessory.context.device = tvConfig;

                        new HttpTelevisionPlatformAccessory(this.log, this.api, tvConfig, this, accessory);
                        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
                    }
                }
            });
        }

        // clean up unused accessories
        this.log.info('removing retired accessories:', retiredAccessories);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, retiredAccessories);
    }

}