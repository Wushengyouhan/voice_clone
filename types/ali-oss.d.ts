declare module "ali-oss" {
  type PutOptions = {
    headers?: Record<string, string>;
  };

  export default class OSS {
    constructor(options: Record<string, unknown>);
    put(name: string, file: Buffer, options?: PutOptions): Promise<unknown>;
  }
}
