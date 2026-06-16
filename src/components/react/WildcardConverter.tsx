import { useState, useCallback } from 'react';

interface WildcardResult {
  mask: string;
  wildcard: string;
  prefix: number;
  hosts: number;
  maskBinary: string;
  wildBinary: string;
  acl: string;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
}

function dottedToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0;
}

function popcount(n: number): number {
  let c = 0;
  for (let v = n >>> 0; v; v >>>= 1) c += v & 1;
  return c;
}

// A 32-bit value is a valid subnet mask iff its bits are contiguous 1s from the
// MSB — i.e. the inverse is contiguous 1s from the LSB (inv & (inv+1) === 0).
function isContiguousMask(maskInt: number): boolean {
  const inv = (~maskInt) >>> 0;
  return ((inv & (inv + 1)) >>> 0) === 0;
}

function toBinaryDotted(n: number): string {
  return intToIp(n)
    .split('.')
    .map((o) => parseInt(o, 10).toString(2).padStart(8, '0'))
    .join('.');
}

function build(maskInt: number): WildcardResult {
  const wildInt = (~maskInt) >>> 0;
  const prefix = popcount(maskInt);
  return {
    mask: intToIp(maskInt),
    wildcard: intToIp(wildInt),
    prefix,
    hosts: prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.pow(2, 32 - prefix),
    maskBinary: toBinaryDotted(maskInt),
    wildBinary: toBinaryDotted(wildInt),
    acl: `access-list 10 permit 10.0.0.0 ${intToIp(wildInt)}`,
  };
}

// Accepts: a CIDR prefix (/24 or 24), a subnet mask (255.255.255.0), or a
// wildcard mask (0.0.0.255). Returns the canonical subnet mask as an int.
function parse(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;

  // /24 or bare 24
  const pm = t.match(/^\/?(\d{1,2})$/);
  if (pm) {
    const p = parseInt(pm[1], 10);
    if (p < 0 || p > 32) return null;
    return p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
  }

  const dm = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!dm) return null;
  const octets = dm.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return null;
  const val = dottedToInt(octets.join('.'));

  if (isContiguousMask(val)) return val;            // entered a subnet mask
  const inv = (~val) >>> 0;
  if (isContiguousMask(inv)) return inv;            // entered a wildcard mask
  return null;                                      // non-contiguous → not a real mask
}

const COMMON_MASKS = [
  { prefix: 30, mask: '255.255.255.252', wild: '0.0.0.3' },
  { prefix: 29, mask: '255.255.255.248', wild: '0.0.0.7' },
  { prefix: 28, mask: '255.255.255.240', wild: '0.0.0.15' },
  { prefix: 27, mask: '255.255.255.224', wild: '0.0.0.31' },
  { prefix: 26, mask: '255.255.255.192', wild: '0.0.0.63' },
  { prefix: 25, mask: '255.255.255.128', wild: '0.0.0.127' },
  { prefix: 24, mask: '255.255.255.0', wild: '0.0.0.255' },
  { prefix: 23, mask: '255.255.254.0', wild: '0.0.1.255' },
  { prefix: 22, mask: '255.255.252.0', wild: '0.0.3.255' },
  { prefix: 16, mask: '255.255.0.0', wild: '0.0.255.255' },
  { prefix: 8, mask: '255.0.0.0', wild: '0.255.255.255' },
];

export default function WildcardConverter() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<WildcardResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const convert = useCallback((val: string) => {
    setInput(val);
    if (!val.trim()) {
      setResult(null);
      setError('');
      return;
    }
    const maskInt = parse(val);
    if (maskInt === null) {
      setResult(null);
      setError('invalid mask — try 255.255.255.0, 0.0.0.255, or /24');
    } else {
      setResult(build(maskInt));
      setError('');
    }
  }, []);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  }, []);

  const rows: [string, string, string][] = result
    ? [
        ['Subnet mask', result.mask, 'mask'],
        ['Wildcard mask', result.wildcard, 'wildcard'],
        ['CIDR prefix', '/' + result.prefix, 'prefix'],
        ['Addresses', result.hosts.toLocaleString(), 'hosts'],
        ['Mask (binary)', result.maskBinary, 'maskbin'],
        ['Wildcard (binary)', result.wildBinary, 'wildbin'],
        ['Cisco ACL example', result.acl, 'acl'],
      ]
    : [];

  return (
    <div className="wc-root">
      <div className="wc-prompt-row">
        <span className="wc-sigil">$</span>
        <span className="wc-cmd">wildcard</span>
        <input
          className="wc-input"
          type="text"
          value={input}
          onChange={(e) => convert(e.target.value)}
          placeholder="255.255.255.0  ·  0.0.0.255  ·  /24"
          spellCheck={false}
          autoComplete="off"
          aria-label="Subnet mask, wildcard mask, or CIDR prefix"
        />
      </div>

      {error && (
        <div className="wc-error">
          <span className="wc-sigil down">[!]</span> {error}
        </div>
      )}

      {result && (
        <div className="wc-output">
          <table className="wc-table">
            <tbody>
              {rows.map(([label, value, key]) => (
                <tr key={key} className="wc-row">
                  <td className="wc-label">{label}</td>
                  <td className="wc-value">
                    <span className="wc-val-text">{value}</span>
                    <button
                      className={`wc-copy ${copied === key ? 'copied' : ''}`}
                      onClick={() => copy(value, key)}
                      aria-label={`Copy ${label}`}
                    >
                      {copied === key ? '✓' : '⎘'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!result && !error && (
        <div className="wc-hint muted">
          paste a subnet mask, a wildcard mask, or a CIDR prefix — e.g.{' '}
          <span className="wc-example">255.255.255.0</span> ·{' '}
          <span className="wc-example">0.0.0.255</span> ·{' '}
          <span className="wc-example">/24</span>. The wildcard is the bitwise
          inverse — what Cisco ACLs and OSPF <code>network</code> statements expect.
        </div>
      )}

      <div className="wc-mask-table">
        <div className="wc-mask-header">
          <span className="wc-bracket">[</span>common masks<span className="wc-bracket">]</span>
        </div>
        <table className="wc-table wc-masks">
          <thead>
            <tr>
              <th>Prefix</th>
              <th>Subnet mask</th>
              <th>Wildcard</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_MASKS.map(({ prefix, mask, wild }) => (
              <tr
                key={prefix}
                className={`wc-row wc-mask-row ${result?.prefix === prefix ? 'active' : ''}`}
                onClick={() => convert(mask)}
              >
                <td className="wc-val-text">/{prefix}</td>
                <td className="wc-val-text">{mask}</td>
                <td className="wc-val-text">{wild}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .wc-root {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.82rem;
          color: var(--c-fg, #e8e6d9);
          background: var(--c-surface, rgba(0,0,0,0.35));
          border: 1px solid var(--c-border, rgba(255,255,255,0.09));
          border-radius: 4px;
          padding: 1.25rem 1.25rem 1rem;
          max-width: 680px;
        }

        .wc-prompt-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .wc-sigil {
          color: var(--c-accent, #39d0d8);
          font-weight: 700;
          user-select: none;
        }

        .wc-sigil.down { color: var(--c-down, #ff4d4f); }

        .wc-cmd { color: var(--c-ok, #00c853); }

        .wc-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--c-border, rgba(255,255,255,0.15));
          color: var(--c-fg, #e8e6d9);
          font-family: inherit;
          font-size: inherit;
          outline: none;
          padding: 0.15rem 0.25rem;
          caret-color: var(--c-accent, #39d0d8);
          transition: border-color 0.15s;
          min-width: 0;
        }

        .wc-input:focus { border-bottom-color: var(--c-accent, #39d0d8); }
        .wc-input::placeholder { color: rgba(232,230,217,0.3); }

        .wc-error {
          color: var(--c-down, #ff4d4f);
          font-size: 0.78rem;
          margin-bottom: 0.75rem;
        }

        .wc-output { margin-bottom: 1.25rem; }

        .wc-table { width: 100%; border-collapse: collapse; }

        .wc-row { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .wc-row:last-child { border-bottom: none; }

        .wc-label {
          color: var(--c-muted, rgba(232,230,217,0.5));
          padding: 0.3rem 0.75rem 0.3rem 0;
          white-space: nowrap;
          width: 40%;
          font-size: 0.78rem;
        }

        .wc-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0;
        }

        .wc-val-text { color: var(--c-fg, #e8e6d9); font-size: 0.82rem; }

        .wc-copy {
          background: transparent;
          border: 1px solid transparent;
          color: var(--c-muted, rgba(232,230,217,0.4));
          cursor: pointer;
          font-family: inherit;
          font-size: 0.7rem;
          padding: 0 0.3rem;
          border-radius: 2px;
          transition: color 0.1s, border-color 0.1s;
          line-height: 1.4;
        }

        .wc-copy:hover {
          color: var(--c-accent, #39d0d8);
          border-color: var(--c-accent, #39d0d8);
        }

        .wc-copy.copied {
          color: var(--c-ok, #00c853);
          border-color: var(--c-ok, #00c853);
        }

        .wc-hint { margin-bottom: 1.25rem; font-size: 0.78rem; line-height: 1.6; }
        .wc-hint code {
          color: var(--c-accent, #39d0d8);
          background: rgba(255,255,255,0.04);
          padding: 0 0.25rem;
          border-radius: 2px;
        }
        .wc-example { color: var(--c-accent, #39d0d8); }

        .wc-mask-table {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }

        .wc-mask-header {
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--c-muted, rgba(232,230,217,0.45));
          margin-bottom: 0.65rem;
        }

        .wc-bracket { color: var(--c-accent, #39d0d8); }

        .wc-masks thead th {
          text-align: left;
          color: var(--c-muted, rgba(232,230,217,0.45));
          font-size: 0.7rem;
          font-weight: 400;
          padding: 0 0.75rem 0.4rem 0;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .wc-mask-row { cursor: pointer; transition: background 0.1s; }
        .wc-mask-row:hover { background: rgba(255,255,255,0.03); }
        .wc-mask-row.active { background: rgba(57, 208, 216, 0.06); }

        .wc-mask-row td {
          padding: 0.22rem 0.75rem 0.22rem 0;
          font-size: 0.79rem;
        }

        .muted { color: var(--c-muted, rgba(232,230,217,0.5)); }
      `}</style>
    </div>
  );
}
