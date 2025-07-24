import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export type InetType = "inet" | "cidr" | "macaddr" | "macaddr8";

export class YacsInetField extends YacsField {
  private inetType: InetType = "inet";

  constructor() {
    super();
    this.type = YacsFieldType.INET;
  }

  public withType(type: InetType): YacsInetField {
    this.inetType = type;
    return this;
  }

  public override default(value: any): this {
    super.default(value);
    return this;
  }

  get networkType(): InetType {
    return this.inetType;
  }
}

export function inet(): YacsInetField {
  return new YacsInetField();
}

export function cidr(): YacsInetField {
  return new YacsInetField().withType("cidr");
}

export function macaddr(): YacsInetField {
  return new YacsInetField().withType("macaddr");
}

export function macaddr8(): YacsInetField {
  return new YacsInetField().withType("macaddr8");
}
