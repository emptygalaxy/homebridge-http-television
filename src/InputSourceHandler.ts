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
    private activeIdentifier?: string;

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
            const identifier = inputName;
            this.log.info(identifier, inputName);

            const inputSource:Service = this.accessory.getService(identifier) ||
                this.accessory.addService(Service.InputSource, identifier, inputName);

            // const inputType = this.mapInputType(input.source);

            inputSource
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                // .setCharacteristic(Characteristic.InputSourceType, inputType)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(Characteristic.Identifier, identifier)
            ;

            inputSource.getCharacteristic(this.api.hap.Characteristic.ConfiguredName)
                .on(this.api.hap.CharacteristicEventTypes.SET, this.setConfiguredInputSourceName.bind(this, identifier));


            if(index === 0) {
                this.activeIdentifier = identifier;
                this.tvService.updateCharacteristic(Characteristic.ActiveIdentifier, this.activeIdentifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.inputServices.push(inputSource);
        });
    }

    private getActiveIdentifier(callback: CharacteristicGetCallback): void {
        this.log.info('get active identifier', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    private setActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            this.log.info('set active identifier', value);

            let activeIndex = 0;
            let activeInput: HttpInputAction|null = null;
            for(let i=0; i<this.inputs.length; i++) {
                const input: HttpInputAction = this.inputs[i];
                if(input.label === value) {
                    activeIndex = i;
                    activeInput = input;
                }
            }

            if(activeInput !== null) {
                console.log('set input', activeIndex);
                this.television.setInput(activeIndex, (result: boolean) => {
                    if(result) {
                        callback(new Error());
                    } else {
                        callback();
                    }
                });
            }
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