import { useState, useCallback } from 'react';

interface SubnetResult {
  ip: string;
  prefix: number;
  network: string;
  broadcast: string;
  mask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  hostCount: number;
  ipClass: string;
  binary: string;
}

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join('.');
}

function ipClass(firstOctet: number): string {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (multicast)';
  return 'E (reserved)';
}

function toBinaryDotted(ip: string): string {
  return ip
    .split('.')
    .map((o) => parseInt(o, 10).toString(2).padStart(8, '0'))
    .join('.');
}

function parseInput(raw: string): SubnetResult | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\/(\d{1,2}))?$/);
  if (!match) return null;

  const ip = match[1];
  const octets = ip.split('.').map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return null;

  const prefix = match[2] !== undefined ? parseInt(match[2], 10) : 24;
  if (prefix < 0 || prefix > 32) return null;

  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipInt = ipToInt(ip);
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;

  const isSlash31 = prefix === 31;
  const isSlash32 = prefix === 32;

  const firstHostInt = isSlash31 || isSlash32 ? networkInt : networkInt + 1;
  const lastHostInt = isSlash31 || isSlash32 ? broadcastInt : broadcastInt - 1;
  const hostCount = isSlash32 ? 1 : isSlash31 ? 2 : Math.pow(2, 32 - prefix) - 2;

  return {
    ip,
    prefix,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    mask: intToIp(maskInt),
    wildcard: intToIp(~maskInt >>> 0),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    hostCount,
    ipClass: ipClass(octets[0]),
    binary: toBinaryDotted(intToIp(networkInt)),
  };
}

const COMMON_CIDRS = [
  { prefix: 30, hosts: 2, label: 'Point-to-point' },
  { prefix: 29, hosts: 6, label: 'Small segment' },
  { prefix: 28, hosts: 14, label: '14 hosts' },
  { prefix: 27, hosts: 30, label: '30 hosts' },
  { prefix: 26, hosts: 62, label: '62 hosts' },
  { prefix: 25, hosts: 126, label: 'Half-C' },
  { prefix: 24, hosts: 254, label: '/24 — class C' },
  { prefix: 23, hosts: 510, label: '2× /24' },
  { prefix: 22, hosts: 1022, label: '4× /24' },
  { prefix: 21, hosts: 2046, label: '8× /24' },
  { prefix: 20, hosts: 4094, label: '16× /24' },
  { prefix: 16, hosts: 65534, label: 'Class B' },
];

export default function SubnetCalc() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const calculate = useCallback((val: string) => {
    setInput(val);
    if (!val.trim()) {
      setResult(null);
      setError('');
      return;
    }
    const r = parseInput(val);
    if (r) {
      setResult(r);
      setError('');
    } else {
      setResult(null);
      setError('invalid input — try 192.168.1.0/24');
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
        ['Network', result.network + '/' + result.prefix, 'network'],
        ['Broadcast', result.broadcast, 'broadcast'],
        ['Subnet mask', result.mask, 'mask'],
        ['Wildcard mask', result.wildcard, 'wildcard'],
        ['First host', result.firstHost, 'first'],
        ['Last host', result.lastHost, 'last'],
        ['Usable hosts', result.hostCount.toLocaleString(), 'hosts'],
        ['IP class', result.ipClass, 'class'],
        ['Binary (network)', result.binary, 'binary'],
      ]
    : [];

  return (
    <div className="sc-root">
      <div className="sc-prompt-row">
        <span className="sc-sigil">$</span>
        <span className="sc-cmd">subnet</span>
        <input
          className="sc-input"
          type="text"
          value={input}
          onChange={(e) => calculate(e.target.value)}
          placeholder="192.168.1.0/24"
          spellCheck={false}
          autoComplete="off"
          aria-label="IP address with CIDR prefix"
        />
      </div>

      {error && (
        <div className="sc-error">
          <span className="sc-sigil down">[!]</span> {error}
        </div>
      )}

      {result && (
        <div className="sc-output">
          <table className="sc-table">
            <tbody>
              {rows.map(([label, value, key]) => (
                <tr key={key} className="sc-row">
                  <td className="sc-label">{label}</td>
                  <td className="sc-value">
                    <span className="sc-val-text">{value}</span>
                    <button
                      className={`sc-copy ${copied === key ? 'copied' : ''}`}
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
        <div className="sc-hint muted">
          enter an IP address with optional CIDR prefix — e.g. <span className="sc-example">10.0.0.0/8</span> or <span className="sc-example">172.16.5.100/20</span>
        </div>
      )}

      <div className="sc-cidr-table">
        <div className="sc-cidr-header">
          <span className="sc-bracket">[</span>common prefixes<span className="sc-bracket">]</span>
        </div>
        <table className="sc-table sc-cidr">
          <thead>
            <tr>
              <th>Prefix</th>
              <th>Hosts</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_CIDRS.map(({ prefix, hosts, label }) => (
              <tr
                key={prefix}
                className={`sc-row sc-cidr-row ${result?.prefix === prefix ? 'active' : ''}`}
                onClick={() => calculate(`${result?.network ?? '10.0.0.0'}/${prefix}`)}
              >
                <td className="sc-val-text">/{prefix}</td>
                <td className="sc-val-text">{hosts.toLocaleString()}</td>
                <td className="muted">{label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .sc-root {
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.82rem;
          color: var(--c-fg, #e8e6d9);
          background: var(--c-surface, rgba(0,0,0,0.35));
          border: 1px solid var(--c-border, rgba(255,255,255,0.09));
          border-radius: 4px;
          padding: 1.25rem 1.25rem 1rem;
          max-width: 680px;
        }

        .sc-prompt-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .sc-sigil {
          color: var(--c-accent, #39d0d8);
          font-weight: 700;
          user-select: none;
        }

        .sc-sigil.down { color: var(--c-down, #ff4d4f); }

        .sc-cmd {
          color: var(--c-ok, #00c853);
        }

        .sc-input {
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
        }

        .sc-input:focus {
          border-bottom-color: var(--c-accent, #39d0d8);
        }

        .sc-input::placeholder {
          color: rgba(232,230,217,0.3);
        }

        .sc-error {
          color: var(--c-down, #ff4d4f);
          font-size: 0.78rem;
          margin-bottom: 0.75rem;
        }

        .sc-output {
          margin-bottom: 1.25rem;
        }

        .sc-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sc-row {
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .sc-row:last-child {
          border-bottom: none;
        }

        .sc-label {
          color: var(--c-muted, rgba(232,230,217,0.5));
          padding: 0.3rem 0.75rem 0.3rem 0;
          white-space: nowrap;
          width: 40%;
          font-size: 0.78rem;
        }

        .sc-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0;
        }

        .sc-val-text {
          color: var(--c-fg, #e8e6d9);
          font-size: 0.82rem;
        }

        .sc-copy {
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

        .sc-copy:hover {
          color: var(--c-accent, #39d0d8);
          border-color: var(--c-accent, #39d0d8);
        }

        .sc-copy.copied {
          color: var(--c-ok, #00c853);
          border-color: var(--c-ok, #00c853);
        }

        .sc-hint {
          margin-bottom: 1.25rem;
          font-size: 0.78rem;
          line-height: 1.6;
        }

        .sc-example {
          color: var(--c-accent, #39d0d8);
        }

        .sc-cidr-table {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }

        .sc-cidr-header {
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--c-muted, rgba(232,230,217,0.45));
          margin-bottom: 0.65rem;
        }

        .sc-bracket {
          color: var(--c-accent, #39d0d8);
        }

        .sc-cidr thead th {
          text-align: left;
          color: var(--c-muted, rgba(232,230,217,0.45));
          font-size: 0.7rem;
          font-weight: 400;
          padding: 0 0.75rem 0.4rem 0;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sc-cidr-row {
          cursor: pointer;
          transition: background 0.1s;
        }

        .sc-cidr-row:hover {
          background: rgba(255,255,255,0.03);
        }

        .sc-cidr-row.active {
          background: rgba(57, 208, 216, 0.06);
        }

        .sc-cidr-row td {
          padding: 0.22rem 0.75rem 0.22rem 0;
          font-size: 0.79rem;
        }

        .muted {
          color: var(--c-muted, rgba(232,230,217,0.5));
        }
      `}</style>
    </div>
  );
}
