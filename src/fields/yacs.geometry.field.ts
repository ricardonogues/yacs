import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export type GeometryType =
  | "POINT"
  | "LINESTRING"
  | "POLYGON"
  | "MULTIPOINT"
  | "MULTILINESTRING"
  | "MULTIPOLYGON"
  | "GEOMETRYCOLLECTION";

export class YacsGeometryField extends YacsField {
  private _geometryType?: GeometryType;
  private _srid?: number; // Spatial Reference System Identifier

  constructor() {
    super();
    this.type = YacsFieldType.GEOMETRY;
  }

  public geometryType(type: GeometryType): YacsGeometryField {
    this._geometryType = type;
    return this;
  }

  public srid(srid: number): YacsGeometryField {
    this._srid = srid;
    return this;
  }

  public default(value: any): YacsGeometryField {
    super.default(value);
    return this;
  }

  get geomType(): GeometryType | undefined {
    return this._geometryType;
  }

  get spatialReference(): number | undefined {
    return this._srid;
  }
}

export function geometry(type?: GeometryType, srid?: number): YacsGeometryField {
  const field = new YacsGeometryField();
  if (type) field.geometryType(type);
  if (srid) field.srid(srid);
  return field;
}

// Convenience functions for common geometry types
export function polygon(): YacsGeometryField {
  return geometry("POLYGON");
}

export function linestring(): YacsGeometryField {
  return geometry("LINESTRING");
}

export function multipoint(): YacsGeometryField {
  return geometry("MULTIPOINT");
}
