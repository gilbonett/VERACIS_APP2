export enum MimeTypeEnum {
  JPEG = "image/jpeg",
  PNG = "image/png",
  WEBP = "image/webp",
  GIF = "image/gif",
  PDF = "application/pdf",
}

const MIME_TYPE_EXTENSIONS: Record<MimeTypeEnum, string> = {
  [MimeTypeEnum.JPEG]: "jpg",
  [MimeTypeEnum.PNG]: "png",
  [MimeTypeEnum.WEBP]: "webp",
  [MimeTypeEnum.GIF]: "gif",
  [MimeTypeEnum.PDF]: "pdf",
};

const VALID_MIME_TYPES = Object.values(MimeTypeEnum);

export class MimeType {
  private constructor(private value: MimeTypeEnum) {}

  static create(mimeType: string): MimeType | null {
    if (!VALID_MIME_TYPES.includes(mimeType as MimeTypeEnum)) {
      return null;
    }
    return new MimeType(mimeType as MimeTypeEnum);
  }

  get mimeType(): string {
    return this.value;
  }

  get extension(): string {
    return MIME_TYPE_EXTENSIONS[this.value];
  }

  get fullExtension(): string {
    return `.${this.extension}`;
  }

  equals(other: MimeType): boolean {
    return this.value === other.value;
  }
}
