import {Logger} from 'homebridge/lib/logger';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {HttpTelevisionAccessoryConfig} from "./HttpTelevisionPluginConfig";
import {Service} from 'hap-nodejs';
import {API} from 'homebridge/lib/api';

export class InformationHandler {
    // config
    private manufacturer: string;
    private model: string;
    private serialNumber: string;
    private version: string;

    private readonly informationService: Service;

    constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly accessory: PlatformAccessory,
        config: HttpTelevisionAccessoryConfig,
    ) {

        // config
        this.manufacturer = config.manufacturer || 'Manufacturer';
        this.model = config.model || 'Model';
        this.serialNumber = config.serialNumber || 'Serial';
        this.version = config.version || 'Version';

        this.informationService = this.createService();
    }

    private createService(): Service {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        const service = (this.accessory.getService(Service.AccessoryInformation) ||
            this.accessory.addService(Service.AccessoryInformation));

        service
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
            .setCharacteristic(Characteristic.FirmwareRevision, this.version)
        ;

        return service;
    }

    public getService(): Service {
        return this.informationService;
    }
}