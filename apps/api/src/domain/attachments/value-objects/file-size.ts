export class FileSize {
  private constructor(private readonly bytes: number) {
    if (bytes < 0) {
      throw new Error("FileSize cannot be negative");
    }
  }

  static create(bytes: number): FileSize {
    return new FileSize(bytes);
  }

  get inBytes(): number {
    return this.bytes;
  }

  get inKilobytes(): number {
    return Math.round(this.bytes / 1024);
  }

  get inMegabytes(): number {
    return Math.round(this.bytes / (1024 * 1024));
  }

  get formatted(): string {
    if (this.bytes >= 1024 * 1024) {
      return `${this.inMegabytes}MB`;
    }
    if (this.bytes >= 1024) {
      return `${this.inKilobytes}KB`;
    }
    return `${this.bytes}B`;
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.inBytes;
  }
}
