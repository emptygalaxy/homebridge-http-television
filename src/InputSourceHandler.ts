import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {
    CharacteristicEventTypes,
} from 'homebridge';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {HttpTelevision, HttpInputAction} from "http-television/dist";
import {HttpTelevisionAccessoryConfig} from "./HttpTelevisionPluginConfig";
import {Service, CharacteristicGetCallback, CharacteristicValue, CharacteristicSetCallback} from 'hap-nodejs';

export class InputSourceHandler {
    private inputs: HttpInputAction[] = [];

    private readonly inputServices: Service[] = [];
    private activeIdentifier?: number;

    constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly accessory: PlatformAccessory,
        private readonly television: HttpTelevision,
        private readonly config: HttpTelevisionAccessoryConfig,
        private readonly tvService: Service,
    ) {
        this.getInputSources(config.actions.inputs);
        this.prepareTelevision();
    }

    public getServices(): Service[] {
        return this.inputServices;
    }

    private prepareTelevision() {
        // hap
        const Characteristic = this.api.hap.Characteristic;

        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on(CharacteristicEventTypes.GET, this.getActiveIdentifier.bind(this))
            .on(CharacteristicEventTypes.SET, this.setActiveIdentifier.bind(this))
        ;
    }

    private getInputSources(inputs?: HttpInputAction[]) {
        if(inputs) {
            this.setupInputs(inputs);
        } else {
            this.setupInputs([
                {label: 'Input 1'},
            ]);
        }
    }

    private setupInputs(inputs: HttpInputAction[]) {
        this.inputs = inputs;

        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // setup
        inputs.forEach((input: HttpInputAction, index: number) => {
            const inputName = input.label;
            const identifier: number = index;
            const subType: string = identifier.toString();
            this.log.info(inputName, identifier);

            const inputSource:Service = this.accessory.getService(subType) ||
                this.accessory.addService(Service.InputSource, inputName, subType);

            const inputType = this.mapInputType(input['type']);

            inputSource
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                .setCharacteristic(Characteristic.InputSourceType, inputType)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(Characteristic.Identifier, identifier)
            ;

            inputSource.getCharacteristic(this.api.hap.Characteristic.ConfiguredName)
                .on(this.api.hap.CharacteristicEventTypes.SET, this.setConfiguredInputSourceName.bind(this, inputName));


            if(index === 0) {
                this.activeIdentifier = identifier;
                this.tvService.updateCharacteristic(Characteristic.ActiveIdentifier, this.activeIdentifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.inputServices.push(inputSource);
        });
    }

    private mapInputType(type: HttpInputType|string|undefined): CharacteristicValue
    {
        const Characteristic = this.api.hap.Characteristic;
        switch(type)
        {
            default:
            case 'other':
                return Characteristic.InputSourceType.OTHER;
            case 'homescreen':
                return Characteristic.InputSourceType.HOME_SCREEN;
            case 'tuner':
                return Characteristic.InputSourceType.TUNER;
            case 'hdmi':
                return Characteristic.InputSourceType.HDMI;
            case 'composite video':
                return Characteristic.InputSourceType.COMPOSITE_VIDEO;
            case 's video':
                return Characteristic.InputSourceType.S_VIDEO;
            case 'component video':
                return Characteristic.InputSourceType.COMPONENT_VIDEO;
            case 'dvi':
                return Characteristic.InputSourceType.DVI;
            case 'airplay':
                return Characteristic.InputSourceType.AIRPLAY;
            case 'usb':
                return Characteristic.InputSourceType.USB;
            case 'application':
                return Characteristic.InputSourceType.APPLICATION;
        }
    }

    private getActiveIdentifier(callback: CharacteristicGetCallback): void {
        this.log.info('get active identifier', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    private setActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            this.log.info('set active identifier', value);

            let activeIndex: number = value as number;

            console.log('set input', activeIndex);
            this.television.setInput(activeIndex, (result: boolean) => {
                if(!result) {
                    callback(new Error());
                } else {
                    this.activeIdentifier = activeIndex;
                    callback();
                }
            });
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }

    private setConfiguredInputSourceName(inputIdentifier: string, value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.log.info('Set input value', inputIdentifier, value);

        // this.accessory.context.inputLabels[inputIdentifier] = value;

        callback();
    }
}

export type HttpInputType = 'other'|'homescreen'|'tuner'|'hdmi'|'composite video'|'s video'|'component video'|'dvi'|'airplay'|'usb'|'application';