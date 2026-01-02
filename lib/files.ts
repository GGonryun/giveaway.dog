import z from 'zod';

export const fileTypeKey = z.nativeEnum({
  JPEG: 'JPEG',
  PNG: 'PNG',
  GIF: 'GIF'
} as const);

export type FileTypeKey = z.infer<typeof fileTypeKey>;

export const fileTypeValueSchema = z.object({
  mime: z.string(),
  label: z.string()
});

export type FileTypeValue = z.infer<typeof fileTypeValueSchema>;

export const FILE_TYPES: Record<FileTypeKey, FileTypeValue> = {
  JPEG: {
    mime: 'image/jpeg',
    label: 'JPEG'
  },
  PNG: {
    mime: 'image/png',
    label: 'PNG'
  },
  GIF: {
    mime: 'image/gif',
    label: 'GIF'
  }
};

export class FileSize {
  static B = 1;
  static KB = 1024;
  static MB = 1024 * 1024;
  static GB = 1024 * 1024 * 1024;
  static TB = 1024 * 1024 * 1024 * 1024;
  value: number;
  unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB';

  constructor(value: number, unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB') {
    this.value = value;
    this.unit = unit;
  }

  toBytes(): number {
    return this.value * FileSize[this.unit];
  }

  toString(): string {
    return `${this.value} ${this.unit}`;
  }
}

export class AcceptedFileTypes {
  keys: FileTypeKey[];
  values: FileTypeValue[];
  mimes: string[];
  labels: string[];

  constructor(keys: FileTypeKey[]) {
    this.keys = keys;
    this.values = keys.map((key) => FILE_TYPES[key]);
    this.mimes = this.values.map((value) => value.mime);
    this.labels = this.values.map((value) => value.label);
  }

  toString(): string {
    return this.labels.join(', ');
  }

  toLabels(): string[] {
    return this.labels;
  }

  includes(type: string): boolean {
    return this.mimes.includes(type) || this.labels.includes(type);
  }
}
