import type {API, PlatformAccessory, Logger, Service} from 'homebridge';
import {HttpTelevision} from 'http-television';

export class TelevisionSpeakerHandler {
  private readonly speakerService: Service;

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly accessory: PlatformAccessory,
    private readonly television: HttpTelevision,
    private readonly tvService: Service,
    private readonly name: string
  ) {
    this.speakerService = this.createSpeaker();
  }

  public getService() {
    return this.speakerService;
  }

  private createSpeaker() {
    // hap
    const Service = this.api.hap.Service;
    // const Characteristic = this.api.hap.Characteristic;

    // service
    const service =
      this.accessory.getService(Service.TelevisionSpeaker) ||
      this.accessory.addService(
        Service.TelevisionSpeaker,
        this.name,
        'tvSpeaker'
      );

    // service
    //     .getCharacteristic(Characteristic.Mute)
    //     .on(CharacteristicEventTypes.GET, this.getTelevisionMuted.bind(this))
    //     .on(CharacteristicEventTypes.SET, this.setTelevisionMuted.bind(this))
    // ;

    this.tvService.addLinkedService(service);

    return service;
  }

  // private getTelevisionMuted(callback: CharacteristicGetCallback): void {
  //     try {
  //         this.television.getVolume() err: string|undefined, state: MuteState) => {
  //             if(err) {
  //                 this.log.error(err);
  //                 callback(new Error(err));
  //             } else {
  //                 this.log.info('muted', state);
  //                 callback(null, state.audio);
  //             }
  //         });
  //     } catch (e) {
  //         this.log.error(e);
  //         callback(e);
  //     }
  // }
  //
  // private setTelevisionMuted(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
  //     try {
  //         const muted = (value === true);
  //         // this.television.setMute(muted, (err: string|undefined, resp) => {
  //         //     this.log.info('setMute', muted, err, resp);
  //         //     if(err) {
  //         //         callback(new Error(err));
  //         //     } else {
  //         //         callback();
  //         //     }
  //         // });
  //     } catch (e) {
  //         this.log.error(e);
  //         callback(e);
  //     }
  // }
}
