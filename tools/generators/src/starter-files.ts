import type { PackageType } from './package.ts';

const camelCase = (name: string) =>
  name.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());

const pascalCase = (name: string) => {
  const camel = camelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const lines = (...rows: string[]) => rows.join('\n') + '\n';

const component = (
  moduleName: string,
  directive: boolean
): { source: string; test: string } => {
  const name = pascalCase(moduleName);
  return {
    source: lines(
      ...(directive ? ["'use client';", ''] : []),
      "import type { ReactNode } from 'react';",
      '',
      `export type ${name}Props = {`,
      '  title: string;',
      '  children?: ReactNode;',
      '};',
      '',
      `export const ${name} = ({ title, children }: ${name}Props) => (`,
      '  <section aria-label={title}>{children}</section>',
      ');'
    ),
    test: lines(
      "import { render, screen } from '@testing-library/react';",
      "import { describe, expect, it } from 'vitest';",
      `import { ${name} } from '../${moduleName}';`,
      '',
      `describe('${name}', () => {`,
      "  it('renders a region named by its title', () => {",
      `    render(<${name} title="Example">Content</${name}>);`,
      '',
      "    expect(screen.getByRole('region', { name: 'Example' })).toHaveTextContent(",
      "      'Content'",
      '    );',
      '  });',
      '});'
    )
  };
};

export const starterFiles = (
  type: PackageType,
  moduleName: string,
  packageName: string
): { source: string; test: string } => {
  const name = camelCase(moduleName);
  switch (type) {
    case 'util':
      return {
        source: lines(
          `export const ${name} = (value: string): string => value.trim();`
        ),
        test: lines(
          "import { describe, expect, it } from 'vitest';",
          `import { ${name} } from '../${moduleName}';`,
          '',
          `describe('${name}', () => {`,
          "  it('trims the value', () => {",
          `    expect(${name}(' value ')).toBe('value');`,
          '  });',
          '});'
        )
      };
    case 'model':
      return {
        source: lines(
          "import { z } from 'zod';",
          '',
          `export const ${name}Schema = z.object({`,
          '  id: z.string().min(1)',
          '});',
          '',
          `export type ${pascalCase(moduleName)} = z.infer<typeof ${name}Schema>;`
        ),
        test: lines(
          "import { describe, expect, it } from 'vitest';",
          `import { ${name}Schema } from '../${moduleName}';`,
          '',
          `describe('${name}Schema', () => {`,
          "  it('accepts an id', () => {",
          `    expect(${name}Schema.parse({ id: 'id-1' })).toEqual({ id: 'id-1' });`,
          '  });',
          '',
          "  it('rejects an empty id', () => {",
          `    expect(${name}Schema.safeParse({ id: '' }).success).toBe(false);`,
          '  });',
          '});'
        )
      };
    case 'server':
      return {
        source: lines(
          "import 'server-only';",
          '',
          `export const ${name} = async (): Promise<string> => '${packageName}';`
        ),
        test: lines(
          "import { describe, expect, it } from 'vitest';",
          `import { ${name} } from '../${moduleName}';`,
          '',
          `describe('${name}', () => {`,
          "  it('returns the package name', async () => {",
          `    await expect(${name}()).resolves.toBe('${packageName}');`,
          '  });',
          '});'
        )
      };
    case 'ui':
      return component(moduleName, false);
    case 'feature':
      return component(moduleName, true);
  }
};
