import { z } from 'zod';

export const CSP_REPORT_MAX_BYTES = 16 * 1024;

export const CSP_REPORT_MAX_VIOLATIONS = 10;

const MAX_FIELD_LENGTH = 200;

const legacyReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string().optional(),
    'effective-directive': z.string().optional(),
    'violated-directive': z.string().optional(),
    'blocked-uri': z.string().optional(),
    'source-file': z.string().optional(),
    'line-number': z.number().optional(),
    disposition: z.string().optional()
  })
});

const reportingApiSchema = z.array(
  z.object({
    type: z.string(),
    body: z
      .object({
        documentURL: z.string().optional(),
        effectiveDirective: z.string().optional(),
        blockedURL: z.string().optional(),
        sourceFile: z.string().optional(),
        lineNumber: z.number().optional(),
        disposition: z.string().optional()
      })
      .optional()
  })
);

export type CspViolation = {
  document: string;
  directive: string;
  blocked: string;
  source?: string;
  line?: number;
  disposition?: string;
};

const withoutQuery = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
};

const clean = (value: string | undefined) =>
  value === undefined
    ? undefined
    : withoutQuery(value).slice(0, MAX_FIELD_LENGTH);

const toViolation = ({
  document,
  directive,
  blocked,
  source,
  line,
  disposition
}: {
  document?: string;
  directive?: string;
  blocked?: string;
  source?: string;
  line?: number;
  disposition?: string;
}): CspViolation => ({
  document: clean(document) ?? '',
  directive: clean(directive) ?? '',
  blocked: clean(blocked) ?? '',
  ...(source ? { source: clean(source) } : {}),
  ...(line !== undefined ? { line } : {}),
  ...(disposition ? { disposition: clean(disposition) } : {})
});

export const parseCspReport = (body: unknown): CspViolation[] => {
  const legacy = legacyReportSchema.safeParse(body);
  if (legacy.success) {
    const report = legacy.data['csp-report'];
    return [
      toViolation({
        document: report['document-uri'],
        directive:
          report['effective-directive'] ?? report['violated-directive'],
        blocked: report['blocked-uri'],
        source: report['source-file'],
        line: report['line-number'],
        disposition: report.disposition
      })
    ];
  }

  const reports = reportingApiSchema.safeParse(body);
  if (!reports.success) return [];

  return reports.data
    .flatMap(({ type, body }) =>
      type === 'csp-violation' && body ? [body] : []
    )
    .slice(0, CSP_REPORT_MAX_VIOLATIONS)
    .map((body) =>
      toViolation({
        document: body.documentURL,
        directive: body.effectiveDirective,
        blocked: body.blockedURL,
        source: body.sourceFile,
        line: body.lineNumber,
        disposition: body.disposition
      })
    );
};
