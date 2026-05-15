// Display metadata for PostCards — supplements the content collection
// (content collection provides article body + pubDate; this provides card-level data)

export const POSTS_META: Record<string, {
  tags: string[];
  ascii: string[];
  accent: string;
  read: string;
  faq: { q: string; a: string }[];
  related: string[];
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
    faq: [
      {
        q: 'How do I diagnose packet loss on my network?',
        a: 'Run `ping -n 100` to quantify the loss percentage, then use MTR to pinpoint which hop is dropping packets. On Cisco, run `show interfaces <port>` and look at CRC errors and input drops. A rising CRC counter almost always points to a physical layer problem: bad cable, faulty SFP, or duplex mismatch.',
      },
      {
        q: 'What causes packet loss on a LAN?',
        a: 'The most common causes are a bad cable or SFP transceiver, a duplex mismatch between the switch port and end device, an overloaded uplink, or a flapping interface. Check interface error counters first — CRC errors point to physical problems, output drops point to congestion.',
      },
      {
        q: 'How do I check for packet loss on a Cisco switch?',
        a: 'Run `show interfaces Gi0/X` and inspect the CRC, input errors, and output drops counters. A non-zero and growing CRC count indicates a physical layer issue. Output drops mean the interface is congested and frames are being discarded.',
      },
    ],
    related: ['troubleshoot-slow-network-performance', '5-free-network-troubleshooting-tools-2026', 'find-what-saturates-your-wan'],
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
    faq: [
      {
        q: 'Can AI generate Cisco IOS or NX-OS configuration?',
        a: 'Yes. Describe what you need in plain English — device type, interface names, VLANs, and the business requirement — and Claude or ChatGPT will output syntactically correct IOS config ready to paste. Always review the output before applying to production.',
      },
      {
        q: 'How do I prompt an AI model to write accurate network configs?',
        a: 'Be specific: include the device platform (IOS, NX-OS, JunOS), interface names, IP addressing, and the goal. Example: "Generate a Cisco IOS config for Gi0/1, access VLAN 20, with port-security allowing 2 MACs." The more context you provide, the more accurate the output.',
      },
      {
        q: 'What AI model is best for generating network configurations?',
        a: 'Claude (Anthropic) performs well on network configuration tasks due to strong technical reasoning and precise instruction following. ChatGPT-4o is also capable. For IOS and NX-OS specifics, Claude tends to produce fewer hallucinated commands on complex multi-step configs.',
      },
    ],
    related: ['using-claude-to-audit-firewall-rules', 'claude-prompt-pack-network-admins', 'troubleshoot-slow-network-performance'],
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
    faq: [
      {
        q: 'What is the PacketPilot Claude Prompt Pack?',
        a: 'The PacketPilot Claude Prompt Pack is a collection of 60+ pre-written prompts for network admins, organized by use case: config generation, troubleshooting, Python automation, security auditing, and documentation. It is a $29 PDF designed to save hours of prompt engineering.',
      },
      {
        q: 'What prompts are included for network administrators?',
        a: 'The pack covers seven categories: Config Generation (Cisco, pfSense, VLANs, ACLs), Troubleshooting (diagnosis, root cause, postmortems), Python & Automation (Netmiko, NAPALM scripts), Security & Auditing (firewall reviews, ACL analysis), Documentation (runbooks, change tickets), and Quick-Fire one-liners for common tasks.',
      },
      {
        q: 'Does the prompt pack work with ChatGPT or only Claude?',
        a: 'The prompts are written for Claude but work with any capable LLM including ChatGPT-4o and Gemini Advanced. Claude is recommended because it handles long network configs and detailed technical reasoning particularly well.',
      },
    ],
    related: ['ai-generate-network-configs', 'using-claude-to-audit-firewall-rules', 'troubleshoot-slow-network-performance'],
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
    faq: [
      {
        q: 'What are the best free network troubleshooting tools?',
        a: 'The five most useful free tools for network admins: Wireshark (packet capture and analysis), MTR (traceroute with live loss and latency stats per hop), Nmap (host discovery and port scanning), iperf3 (throughput testing between two endpoints), and LibreNMS (SNMP-based monitoring with alerting). All are open source and production-ready.',
      },
      {
        q: 'Is Wireshark free for commercial or enterprise use?',
        a: 'Yes. Wireshark is licensed under GPLv2 and is free to use in commercial and enterprise environments with no restrictions or licensing fees. It runs on Windows, macOS, and Linux.',
      },
      {
        q: 'What is the best free alternative to SolarWinds for network monitoring?',
        a: 'LibreNMS is the most capable free alternative to SolarWinds. It supports SNMP auto-discovery, customizable alerting, NetFlow collection, and a polished web dashboard. For smaller deployments, Zabbix and Nagios Core are also widely used. All three are open source with active communities.',
      },
    ],
    related: ['diagnose-packet-loss', 'diagnose-dns-failures-fast', 'find-what-saturates-your-wan'],
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
    faq: [
      {
        q: 'How do I diagnose DNS failures on my network?',
        a: 'Start with `nslookup <hostname> <dns-server>` or `dig @<dns-server> <hostname>` to test the specific resolver. If the resolver responds but slowly (over 100ms query time in the `+stats` output), the forwarder chain is the issue. If it does not respond at all, check that UDP and TCP port 53 is not blocked by a firewall rule.',
      },
      {
        q: 'Why is DNS resolution slow on my corporate network?',
        a: 'Slow DNS is almost always a misconfigured or overloaded upstream forwarder. Run `dig @<your-resolver> corp.internal +stats` to measure query time at the resolver level. If the resolver is fast but clients are slow, verify clients are actually using the correct DNS server with `ipconfig /all` on Windows or `resolvectl status` on Linux.',
      },
      {
        q: 'What is the dig command to test DNS from Linux?',
        a: 'Use `dig @<nameserver-ip> <hostname> +short` for a quick answer, or `dig @<nameserver-ip> <hostname> +stats` to include query latency and full response details. Example: `dig @192.168.1.1 corp.local +stats` tests your internal resolver directly and shows TTL, answer, and query time in milliseconds.',
      },
    ],
    related: ['troubleshoot-slow-network-performance', 'diagnose-packet-loss', '5-free-network-troubleshooting-tools-2026'],
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
    faq: [
      {
        q: 'How do I find what is saturating my WAN link?',
        a: 'Enable NetFlow or sFlow on your edge router and collect data in a flow collector (LibreNMS, ntopng, or PRTG). Sort by top talkers over a 5–15 minute window during the saturation event. If you cannot enable NetFlow, check `show interfaces` output drops on your WAN interface as a quick congestion indicator.',
      },
      {
        q: 'What tool shows top bandwidth consumers on my network?',
        a: 'LibreNMS with flow collection, ntopng, PRTG, or ManageEngine NetFlow Analyzer are the main options. For a quick free option, ntopng community edition gives per-host and per-protocol bandwidth breakdown in real time without requiring a license.',
      },
      {
        q: 'How do I use NetFlow to identify bandwidth hogs?',
        a: 'Configure your router to export NetFlow v5 or v9 to a collector IP and port. In the collector, sort flows by bytes during the peak congestion window. Look for a single source IP consuming disproportionate bandwidth — nightly backups, Windows Update distribution, and rogue VMs running cloud syncs are the most common culprits.',
      },
    ],
    related: ['diagnose-packet-loss', 'troubleshoot-slow-network-performance', '5-free-network-troubleshooting-tools-2026'],
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
    faq: [
      {
        q: 'How do I troubleshoot slow network performance?',
        a: 'Work the OSI stack bottom-up: check Layer 1 (cable errors, port flaps), Layer 2 (spanning tree, duplex mismatch), Layer 3 (MTU, routing loops), and Layer 4 (TCP retransmissions). Use `show interfaces` for error counters, MTR for path analysis, and Wireshark with the filter `tcp.analysis.retransmission` to confirm TCP-level loss.',
      },
      {
        q: 'Why is my network slow even though the link shows 100%?',
        a: 'A link at 100% line rate does not mean no errors. Check for MTU mismatches (a common cause of TCP slowdowns), high retransmission rates visible in Wireshark, or QoS policies dropping traffic before it hits the wire. Run `show interfaces` and look at output drops and output errors — both indicate the link is congested or misconfigured.',
      },
      {
        q: 'What is the most common cause of slow network performance in enterprise networks?',
        a: 'MTU mismatches and resulting TCP retransmissions are the most frequently missed root causes. A legacy interface or VPN tunnel with a 1492-byte MTU creates fragmentation overhead that shows up as general sluggishness but is invisible to basic ping tests. Test with `ping -l 1400 -f <gateway>` on Windows or `ping -M do -s 1400 <gateway>` on Linux to confirm.',
      },
    ],
    related: ['diagnose-packet-loss', 'diagnose-dns-failures-fast', '5-free-network-troubleshooting-tools-2026'],
  },

  '3d-printer-filament-comparison-guide': {
    tags: ['3d-printing', 'comparison', 'guide'],
    ascii: [
      '[1] PLA    → easy · indoor · brittle',
      '[2] PETG   → outdoor · UV-tol · tough',
      '[3] ABS    → heat 100°C · acetone',
      '[4] ASA    → outdoor + UV-proof',
      '[5] TPU    → flex · grip · rubber',
      '[6] Nylon  → strongest · dry it',
      '[7] PC     → engineering · 130°C',
    ],
    accent: 'accent',
    read: '14 min',
    faq: [
      {
        q: 'What is the best 3D printer filament for outdoor parts?',
        a: 'ASA is the best filament for outdoor 3D prints because it is UV-resistant and does not yellow or crack in sunlight. PETG is the second-best option for shaded outdoor parts. Avoid PLA outdoors — it degrades in heat and UV. Avoid ABS in direct sun — it yellows and cracks within a year.',
      },
      {
        q: 'What is the strongest 3D printer filament?',
        a: 'Polycarbonate (PC) is the strongest common FDM filament by tensile strength, followed by Nylon (PA) and carbon-fiber-reinforced variants. For most consumer printers, Nylon is the strongest practical choice — PC requires an all-metal hotend rated to 300°C+ and a heated chamber.',
      },
      {
        q: 'What is the difference between PLA and PETG?',
        a: 'PLA is easier to print and captures more detail but is brittle and has poor heat resistance (~60°C). PETG is slightly harder to print but tougher, slightly flexible, heat-resistant to ~75°C, and tolerates outdoor exposure. Use PLA for indoor display models; use PETG for parts that get handled or go outside.',
      },
    ],
    related: [],
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
    faq: [
      {
        q: 'Can AI audit my firewall rules?',
        a: 'Yes. Paste your firewall ruleset into Claude with a prompt like "Review these rules for shadowed rules, any/any permits, and missing egress filtering." Claude identifies shadowed rules (rules that are never matched because a broader rule above already captures the traffic), overly permissive permits, and common rule ordering issues.',
      },
      {
        q: 'What firewall rule mistakes can AI detect?',
        a: 'AI models reliably detect: shadowed rules (a rule that is never reached because a broader rule above it matches first), any/any permit rules, missing egress filtering, inbound rules allowing unnecessary services, and rule ordering problems. They are less reliable for stateful inspection logic and vendor-specific behavior edge cases.',
      },
      {
        q: 'How do I export my firewall rules to audit with Claude?',
        a: 'On pfSense: export config.xml from Diagnostics > Backup & Restore. On Cisco ASA: run `show run access-list` from the CLI. On Palo Alto: export from Device > Setup > Operations > Export named configuration snapshot. Paste the relevant sections into Claude with a clear audit prompt. Redact sensitive internal hostnames or IP ranges before pasting if needed.',
      },
    ],
    related: ['ai-generate-network-configs', 'claude-prompt-pack-network-admins', '5-free-network-troubleshooting-tools-2026'],
  },
};
