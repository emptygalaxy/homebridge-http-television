import type {
  API,
  Logger,
  PlatformAccessory,
  Service,
  CharacteristicGetCallback,
  CharacteristicValue,
  CharacteristicSetCallback,
} from 'homebridge';
import {CharacteristicEventTypes} from 'homebridge';
import {HttpTelevision, TelevisionEvent} from 'http-television';
import type {RemoteKey} from 'http-television';

export class TelevisionHandler {
  private readonly tvService: Service;
  private readonly switchService?: Service;

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly accessory: PlatformAccessory,
    private readonly television: HttpTelevision,
    private readonly name: string,
    private readonly enableSwitch = false
  ) {
    this.tvService = this.createService();
    if (this.enableSwitch) {
      this.switchService = this.createSwitchService();
    }

    television.addListener(
      TelevisionEvent.ActiveChanged,
      this.updateTelevisionActive.bind(this)
    );
  }

  private createService(): Service {
    // hap
    const Service = this.api.hap.Service;
    const Characteristic = this.api.hap.Characteristic;

    // service
    const tvService =
      this.accessory.getService(Service.Television) ||
      this.accessory.addService(Service.Television, this.name);

    tvService
      .setCharacteristic(Characteristic.ConfiguredName, this.name)
      .setCharacteristic(
        Characteristic.SleepDiscoveryMode,
        Characteristic.SleepDiscoveryMode.NOT_DISCOVERABLE
      )
      .setCharacteristic(Characteristic.ActiveIdentifier, 0);
    tvService
      .getCharacteristic(Characteristic.Active)
      .on(CharacteristicEventTypes.GET, this.getTelevisionActive.bind(this))
      .on(CharacteristicEventTypes.SET, this.setTelevisionActive.bind(this));
    tvService
      .getCharacteristic(this.api.hap.Characteristic.RemoteKey)
      .on(CharacteristicEventTypes.SET, this.setRemoteKey.bind(this));

    return tvService;
  }

  private createSwitchService(): Service {
    // hap
    const Service = this.api.hap.Service;
    const Characteristic = this.api.hap.Characteristic;

    // service
    const service =
      this.accessory.getService(Service.Switch) ||
      this.accessory.addService(Service.Switch, this.name);
    service
      .getCharacteristic(Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.getTelevisionActive.bind(this))
      .on(CharacteristicEventTypes.SET, this.setTelevisionActive.bind(this));

    return service;
  }

  public getService(): Service {
    return this.tvService;
  }

  public getSwitchService(): Service | undefined {
    return this.switchService;
  }

  /**
   * Get television active
   * @param callback
   */
  private getTelevisionActive(callback: CharacteristicGetCallback): void {
    const active = this.television.isActive();
    this.log.info('television active', active);
    callback(null, active);
  }

  /**
   * Set television active
   * @param {boolean} value
   * @param callback
   */
  private setTelevisionActive(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback
  ): void {
    try {
      const enable = value === 1 || value === true;

      const cb = (result: boolean) => {
        callback(result ? null : new Error());
      };

      enable ? this.television.powerOn(cb) : this.television.powerOff(cb);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        this.log.error(e.toString());
        callback(e);
      }
    }
  }

  private updateTelevisionActive(): void {
    const Characteristic = this.api.hap.Characteristic;

    const active = this.tvService.getCharacteristic(Characteristic.Active);
    active.updateValue(
      this.television.isActive()
        ? Characteristic.Active.ACTIVE
        : Characteristic.Active.INACTIVE
    );

    if (this.switchService) {
      const switchOn = this.switchService.getCharacteristic(Characteristic.On);
      switchOn.updateValue(this.television.isActive());
    }
  }

  private translateRemoteKey(value: CharacteristicValue): RemoteKey | null {
    const Characteristic = this.api.hap.Characteristic;
    switch (value) {
      case Characteristic.RemoteKey.REWIND:
        return 'rewind';
      case Characteristic.RemoteKey.FAST_FORWARD:
        return 'forward';

      case Characteristic.RemoteKey.NEXT_TRACK:
      case Characteristic.RemoteKey.PREVIOUS_TRACK:
        return null;

      case Characteristic.RemoteKey.ARROW_UP:
        return 'up';
      case Characteristic.RemoteKey.ARROW_DOWN:
        return 'down';
      case Characteristic.RemoteKey.ARROW_LEFT:
        return 'left';
      case Characteristic.RemoteKey.ARROW_RIGHT:
        return 'right';
      case Characteristic.RemoteKey.SELECT:
        return 'select';
      case Characteristic.RemoteKey.BACK:
        return 'back';
      case Characteristic.RemoteKey.EXIT:
        return 'exit';
      case Characteristic.RemoteKey.PLAY_PAUSE:
        return 'playPause';
      case Characteristic.RemoteKey.INFORMATION:
        return 'info';

      default:
        return null;
    }
  }

  private setRemoteKey(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback
  ): void {
    this.log.info('setRemoteKey', value);

    const key = this.translateRemoteKey(value);
    if (key) {
      const cb = (result: boolean) => {
        callback(result ? null : new Error());
      };

      if (key === 'playPause') this.television.playPause(cb);
      else this.television.pressKey(key, cb);
    } else callback();
  }
}
