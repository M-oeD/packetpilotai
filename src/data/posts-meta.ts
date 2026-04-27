// Display metadata for PostCards — supplements the content collection
// (content collection provides article body + pubDate; this provides card-level data)

export const POSTS_META: Record<string, {
  tags: string[];
  ascii: string[];
  accent: string;
  read: string;
}> = {
  'diagnose-packet-loss': {
    tags: ['troubleshooting', 'L1', 'wireshark'],
    ascii: [
      '$ ping 192.168.1.1 -n 100',
      'Sent=100  Received=83  Lost=17 (17%)',
      'SW01# show interfaces Gi0/4',
      '  CRC: 3,201   ← bad cable / duplex',
      '[!] root cause: Gi0/4 cabling',
    ],
    accent: 'warn',
    read: '9 min',
  },
  'ai-generate-network-configs': {
    tags: ['ai', 'config', 'cisco'],
    ascii: [
      '$ claude "VLAN 10 guest, Gi0/1 access"',
      '[+] vlan 10',
      '[+]   name GUEST_WIFI',
      '[+] interface Gi0/1',
      '[+]   switchport mode access',
      'Done. Config ready to paste. ✓',
    ],
    accent: 'ok',
    read: '7 min',
  },
  'claude-prompt-pack-network-admins': {
    tags: ['pack', 'claude', 'release'],
    ascii: [
      '┌─ PROMPT PACK v1 ──────────────┐',
      '│ ⚙  Config Generation     ×7  │',
      '│ 🔍  Troubleshooting       ×7  │',
      '│ 🐍  Python Automation     ×6  │',
      '│ 🔒  Security & Auditing   ×5  │',
      '│ ⚡  Quick-Fire           ×10  │',
      '└──────────────  $29  ──────────┘',
    ],
    accent: 'accent',
    read: '5 min',
  },
  '5-free-network-troubleshooting-tools-2026': {
    tags: ['tools', 'free', 'loadout'],
    ascii: [
      '[1] Wireshark  → every packet on the wire',
      '[2] Nmap       → who is on my network',
      '[3] iperf3     → is this link actually fast?',
      '[4] LibreNMS   → what happened over time',
      '[5] MTR        → where exactly the path dies',
    ],
    accent: 'ok',
    read: '11 min',
  },
  'diagnose-dns-failures-fast': {
    tags: ['dns', 'troubleshooting'],
    ascii: [
      '$ dig @192.168.1.1 corp.local +stats',
      ';; ANSWER SECTION:',
      'corp.local. 60 IN A 10.0.4.20',
      ';; Query time: 412 ms   ← way too slow',
      '↳ check resolver upstream chain',
    ],
    accent: 'warn',
    read: '6 min',
  },
  'find-what-saturates-your-wan': {
    tags: ['wan', 'netflow', 'analysis'],
    ascii: [
      'TOP TALKERS  · last 5m',
      '  10.0.4.42   480 Mb/s   ████████████',
      '  10.0.4.20    96 Mb/s   ███',
      '  10.0.7.11    44 Mb/s   ██',
      '→ host .42 = nightly backup window',
    ],
    accent: 'accent',
    read: '8 min',
  },
  'troubleshoot-slow-network-performance': {
    tags: ['performance', 'methodology'],
    ascii: [
      'LAYER 1  cable/port      ✓ pass',
      'LAYER 2  switching       ✓ pass',
      'LAYER 3  routing/MTU     ✗ MTU 1492',
      'LAYER 4  TCP retrans     ✗ 4.1%',
      'LAYER 7  app             — N/A',
    ],
    accent: 'warn',
    read: '10 min',
  },
  'using-claude-to-audit-firewall-rules': {
    tags: ['security', 'ai', 'firewall'],
    ascii: [
      '$ claude --review fw.conf',
      '[!] rule 14 shadowed by rule 9',
      '[!] rule 22 permits any/any',
      '[+] suggest:  tighten src to 10.0.0.0/8',
      'audit complete · 3 high · 5 med',
    ],
    accent: 'down',
    read: '7 min',
  },
};
