import {HttpTelevisionConfig} from 'http-television';
import type {PlatformConfig} from 'homebridge';

export interface HttpTelevisionPluginConfig extends PlatformConfig {
  televisions?: HttpTelevisionAccessoryConfig[];
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
  category?: 'television' | 'top set box';
}
