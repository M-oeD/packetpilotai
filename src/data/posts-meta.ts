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
  'setting-up-claude-for-real-work': {
    tags: ['ai'],
    ascii: [
      '$ claude            # most use 10% of it',
      '[ ] context file     ← stop starting cold',
      '[ ] real files wired ← grounded > guessing',
      '[ ] plan-first + skeptic review',
      '✓ tutorial level → operator',
    ],
    accent: 'accent',
    read: '6 min',
    faq: [
      {
        q: 'How do I set up Claude for serious work?',
        a: 'Give it a context file once (a Claude Project, or a CLAUDE.md in your repo) describing your role, stack, conventions, and hard never-do rules; connect it to your real files and tools instead of pasting snippets; make it plan before acting; and run a skeptic-review pass on its output. Those four moves account for most of the gap between mediocre and senior-level results.',
      },
      {
        q: 'What is a CLAUDE.md or Claude Project context file?',
        a: 'It is a single file (a Project on claude.ai, or a CLAUDE.md in your project folder for Claude Code) that holds the context Claude needs every time: who you are, what you are working on, your stack, your conventions, and what it should never do. Writing it once stops Claude from guessing, which is the cause of most bad output.',
      },
      {
        q: 'Why is my Claude output mediocre?',
        a: 'Almost always setup and prompting, not the model. Most people start cold with no context, accept the first draft, and never set guardrails. Give it context, make it plan first, and ask it to critique its own work as a skeptical senior reviewer. The second pass is consistently sharper than the first.',
      },
    ],
    related: ['claude-prompt-pack-network-admins', 'ai-generate-network-configs', 'using-claude-to-audit-firewall-rules'],
  },

  'diagnose-packet-loss': {
    tags: ['troubleshooting'],
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
    tags: ['ai', 'cisco'],
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
    tags: ['ai'],
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
    tags: ['ai'],
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
    tags: ['wan', 'automation', 'troubleshooting'],
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
    tags: ['troubleshooting'],
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

  'using-claude-to-audit-firewall-rules': {
    tags: ['security', 'ai'],
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

  'failure-01-spanning-tree-loop-at-3am': {
    tags: ['switching', 'troubleshooting'],
    ascii: [
      '03:14  ALERT  ping loss 47% · all VLANs',
      '03:14  ALERT  core cpu 98% · mac-flap 2400/s',
      '03:31  "why is bpdufilter set on Gi1/0/14?"',
      '03:33  RESOLVED  port [BLK] · cpu 5%',
      '[!] root cause: rogue switch + bpdufilter',
    ],
    accent: 'down',
    read: '11 min',
    faq: [
      {
        q: 'What is the difference between spanning-tree bpdufilter and bpduguard?',
        a: 'bpduguard shuts down a port the moment it receives a BPDU — protective. bpdufilter stops the port from sending or receiving BPDUs entirely — destructive. bpduguard is the correct default for access ports running portfast. bpdufilter should almost never be enabled; it blinds spanning tree to anything happening on that port, which means a downstream loop becomes invisible until traffic levels make it visible.',
      },
      {
        q: 'How do I detect a Layer 2 loop on a Cisco switch?',
        a: 'The fastest signal is MAC address flapping: the same MAC address appearing on two different ports within seconds. Run show mac address-table address <MAC> twice in quick succession; if the port changes, you have a loop. Other signals: HLFM address learning CPU spikes, broadcast rates above the historical baseline, and any port in forwarding state that should not have a redundant path.',
      },
      {
        q: 'Why did not spanning tree prevent the broadcast storm automatically?',
        a: 'It would have. The reason it did not in this case is that one of the involved ports had spanning-tree bpdufilter enable configured, which made it deaf to spanning tree loop-detection protocol. Spanning tree only blocks ports where it can see redundant paths via BPDUs. Block the BPDUs and you blind the algorithm.',
      },
      {
        q: 'Should I enable BPDU guard or BPDU filter on access ports?',
        a: 'BPDU guard. Every time. spanning-tree bpduguard enable paired with spanning-tree portfast is the safe default for any port connected to an end device. If anyone plugs a switch into that port, BPDU guard will shut the port down — loud and unmistakable. The opposite command, bpdufilter, hides exactly the failure mode you want to catch.',
      },
    ],
    related: ['troubleshoot-slow-network-performance', 'diagnose-packet-loss', 'find-what-saturates-your-wan'],
  },

  'potw-01-truncated-dns-query': {
    tags: ['dns', 'troubleshooting'],
    ascii: [
      '14:22:01  10.0.4.42 → resolver  UDP/53 query',
      '14:22:01  resolver → 10.0.4.42  TC=1 (truncated)',
      '14:22:01  10.0.4.42 → resolver  TCP/53 [SYN]',
      '14:22:04  10.0.4.42 → resolver  TCP/53 [SYN] retry',
      '[!] root cause: host blocks TCP/53',
    ],
    accent: 'ok',
    read: '4 min',
    faq: [
      {
        q: 'When does a DNS query actually use TCP instead of UDP?',
        a: 'When the response is too large to fit in the client\'s UDP buffer (512 bytes without EDNS0, up to ~4096 with it), the resolver sets the truncated flag (TC=1) and the client retries the same query over TCP/53. Zone transfers (AXFR/IXFR) also always use TCP. Modern DNS — especially with DNSSEC, large TXT records, or long CNAME chains — relies on TCP fallback more often than people assume.',
      },
      {
        q: 'What does TC=1 mean in a DNS response?',
        a: 'TC=1 is the truncation flag. The resolver had a valid answer but it did not fit in a single UDP datagram, so it sent a short response with the TC bit set and no answer payload. The client is expected to retry over TCP/53. If TCP/53 is blocked on the path — or on the host itself — the query fails even though the resolver is healthy.',
      },
      {
        q: 'How do I test whether TCP/53 is reachable from a Windows host?',
        a: 'Run Test-NetConnection -ComputerName <resolver-ip> -Port 53 from PowerShell. The output shows TcpTestSucceeded : True if the handshake completes. From Linux or Mac, use nc -zv <resolver-ip> 53. Running this on both the working and broken machine isolates a host-level block in under a minute.',
      },
    ],
    related: ['diagnose-dns-failures-fast', 'troubleshoot-slow-network-performance', '5-free-network-troubleshooting-tools-2026'],
  },

  'showdown-01-claude-vs-chatgpt-vs-gemini-bgp': {
    tags: ['routing', 'ai'],
    ascii: [
      '$ ai "dual-homed eBGP · no transit"',
      '[✓] neighbors  AS64500 / AS64501',
      '[✓] originate  192.0.2.0/24',
      '[✗] outbound filter  MISSING',
      '[!] route leak in one missing line',
    ],
    accent: 'warn',
    read: '10 min',
    faq: [
      {
        q: 'Can an AI model configure BGP correctly?',
        a: 'Yes — given a specific prompt. Modern models produce syntactically valid, paste-ready eBGP configs for a stated platform when you specify the local AS, the neighbors, the exact prefixes to advertise, and the path policy. Accuracy drops sharply on vague prompts: the more you leave implicit — filtering, path preference, safety limits — the more the model omits. Always score the output against a fixed checklist before you apply it.',
      },
      {
        q: 'What is the most common BGP mistake AI models make?',
        a: 'Omitting the outbound prefix filter on a dual-homed router. The neighbors come up and traffic flows, so the config looks correct, but with no outbound filter the router re-advertises routes learned from one ISP to the other — a route leak that briefly turns you into an unintended transit AS. Confirm that every eBGP neighbor has an outbound prefix-list permitting only your own prefixes.',
      },
      {
        q: 'How do I stop my BGP router from becoming a transit AS?',
        a: 'Apply an outbound prefix-list to every eBGP neighbor that permits only the prefixes you own and denies everything else. On Cisco IOS that is `ip prefix-list MY-OUT permit <your-prefix>` plus `neighbor <ip> prefix-list MY-OUT out` on each neighbor. Pair it with `maximum-prefix` inbound so a peer that leaks the full table triggers a warning instead of an outage.',
      },
    ],
    related: ['acr-01-reddit-bgp-configs', 'ai-generate-network-configs', 'using-claude-to-audit-firewall-rules'],
  },

  'migration-cisco-asa-to-pfsense': {
    tags: ['firewalls', 'cisco'],
    ascii: [
      'CISCO ASA          →   pfSense',
      'security-level     →   (none)',
      'access-list        →   Firewall ▸ Rules',
      'nat (inside,out)   →   Firewall ▸ NAT',
      '[!] ASA trusts by level; pfSense does not',
    ],
    accent: 'accent',
    read: '13 min',
    faq: [
      {
        q: 'Can I migrate a Cisco ASA configuration to pfSense?',
        a: 'Yes, but not as a literal line-by-line port. Interfaces, ACLs, NAT, object-groups, static routes, and site-to-site IPsec VPNs all have clean pfSense equivalents. The two things that do not port directly are ASA security levels (pfSense has no implicit trust — you write explicit rules) and AnyConnect SSL VPN (pfSense uses OpenVPN or WireGuard, so remote clients change). Plan those two as their own workstreams.',
      },
      {
        q: 'What is the biggest difference between Cisco ASA and pfSense?',
        a: 'The trust model. The ASA assigns every interface a security level (0–100) and implicitly permits traffic from a higher level to a lower one with no explicit rule. pfSense has no security levels and permits nothing inbound until you write a pass rule. Migrations break when admins translate the ACLs perfectly but forget to recreate the permissions the ASA was granting implicitly by security level.',
      },
      {
        q: 'Does pfSense support AnyConnect VPN clients?',
        a: 'No. pfSense cannot act as a Cisco AnyConnect headend. The standard replacements are OpenVPN (with the OpenVPN Connect client) or WireGuard. Your LDAP/RADIUS authentication and certificates can usually carry over, but every remote user must install a new client and import a new profile — communicate this well before cutover.',
      },
    ],
    related: ['using-claude-to-audit-firewall-rules', 'ai-generate-network-configs', 'claude-prompt-pack-network-admins'],
  },

  'acr-01-reddit-bgp-configs': {
    tags: ['routing', 'ai'],
    ascii: [
      'router bgp 65001',
      '  network 10.0.0.0     [!] no mask',
      '  neighbor … iBGP      [!] no next-hop-self',
      '  neighbor … eBGP      [!] no filters',
      'verdict: comes up, black-holes traffic',
    ],
    accent: 'info',
    read: '9 min',
    faq: [
      {
        q: 'Why does my BGP session come up but traffic does not flow?',
        a: 'The most common cause on iBGP is an unreachable next-hop. When a router passes an eBGP-learned route to an iBGP peer, it keeps the original external next-hop by default. If the receiving router has no route to that external address, BGP marks the prefix inaccessible and never installs it — so the session is Established but traffic black-holes. The fix is `neighbor <peer> next-hop-self` on the router that holds the eBGP session. Also confirm your `network` statements actually match a route in the table.',
      },
      {
        q: 'What does next-hop-self do in BGP?',
        a: '`neighbor <peer> next-hop-self` tells a router to advertise itself as the next-hop for the routes it sends to that iBGP peer, instead of preserving the original eBGP next-hop. It is the standard fix for iBGP peers that cannot reach the external next-hop of eBGP-learned routes. You apply it on the border router — the one with the eBGP session — on its iBGP neighbor statements.',
      },
      {
        q: 'Is it safe to use AI-generated BGP configs?',
        a: 'Only after a semantic audit. AI models reliably produce configs that establish a session, but they frequently miss next-hop reachability, real prefix origination, and inbound/outbound filtering — bugs that stay invisible until real traffic or a real routing table arrives. Treat any AI-generated BGP config as a draft: verify it advertises what you intend, installs routes on every router, and filters in both directions before it touches production.',
      },
    ],
    related: ['showdown-01-claude-vs-chatgpt-vs-gemini-bgp', 'ai-generate-network-configs', 'using-claude-to-audit-firewall-rules'],
  },

  'potw-02-one-byte-then-silence': {
    tags: ['wan'],
    ascii: [
      '$ ssh app01   # hangs after connect',
      '[ok] SYN / SYN-ACK / ACK',
      '[ok] 1-byte push ACKed',
      '[!!] 1460B [DF] retrans ×5, no ACK',
      'tell: MTU black hole → clamp MSS',
    ],
    accent: 'ok',
    read: '5 min',
    faq: [
      {
        q: 'What is a PMTUD (Path MTU Discovery) black hole?',
        a: 'A PMTUD black hole happens when a packet is too large for a hop on the path and has the Don\'t Fragment bit set, but the ICMP "fragmentation needed" message that should tell the sender to use smaller packets is filtered or dropped. The sender never learns its packets are too big, so it retransmits the same oversized segment until the connection stalls. It is common across VPN, GRE, and PPPoE links where encapsulation lowers the usable MTU.',
      },
      {
        q: 'Why does a TCP connection complete the handshake and then hang?',
        a: 'Because the handshake and the first tiny bits of data use small packets that fit the path, while the first full-size segment exceeds an MTU somewhere along the route. If that hop drops Don\'t-Fragment packets and the ICMP fragmentation-needed reply is blocked, the large segment is retransmitted into silence and the session hangs. The giveaway in a capture is a full-size segment with the [DF] flag retransmitting with no ACK and no returning ICMP.',
      },
      {
        q: 'How do I fix an MTU black hole with MSS clamping?',
        a: 'Clamp the TCP MSS on the tunnel or choke-point interface so both sides negotiate a segment size that fits the path. On Cisco IOS that is `ip tcp adjust-mss 1360` on the tunnel interface (path MTU 1400 minus 40 bytes of IP/TCP header). This rewrites the MSS in the TCP SYN so no segment is ever too big to cross. Also stop filtering ICMP type 3 code 4 so Path MTU Discovery can work on its own.',
      },
    ],
    related: ['potw-01-truncated-dns-query', 'troubleshoot-slow-network-performance', 'diagnose-packet-loss'],
  },

  'potw-03-duplicate-ip-arp-war': {
    tags: ['switching'],
    ascii: [
      '$ ping 10.0.4.50  # up...down...up',
      'arp -a → 10.0.4.50:',
      '  00-1a-2b-3c-4d-5e   then…',
      '  00-50-56-9a-11-22   same IP!',
      'tell: duplicate IP — last ARP wins',
    ],
    accent: 'ok',
    read: '5 min',
    faq: [
      {
        q: 'What causes a host to be intermittently reachable on a clean cycle?',
        a: 'A repeating up/down cycle that survives reboots and cable swaps is the signature of a duplicate IP address. Two devices share one IP, and each periodically sends a gratuitous ARP that overwrites the mapping in every neighbor\'s ARP cache and the switch MAC table. Traffic follows whichever host announced last, so the service "blinks" as the two hosts take turns winning. Random hardware faults do not produce a clean, repeating rhythm.',
      },
      {
        q: 'How do I find a duplicate IP address on my network?',
        a: 'Run `arp -a` for the affected IP a few times in a row; if it resolves to two different MAC addresses, you have a duplicate. Then map each MAC to a switch port with `show mac address-table address <mac>` on Cisco and walk the cable. The MAC\'s OUI (first half) often identifies the vendor — a VMware OUI points at a cloned VM. On Windows, a TCP/IP address-conflict event (ID 4199) names the conflicting hardware address.',
      },
      {
        q: 'How do I prevent duplicate IP and ARP spoofing on a switch?',
        a: 'Enable DHCP snooping and Dynamic ARP Inspection (DAI) on the access switches. DAI validates every ARP packet against the DHCP snooping binding table and drops spoofed or duplicate announcements before they can poison neighbor caches. Pair it with DHCP reservations for static hosts so every address has a single source of truth and static IPs cannot collide with the DHCP pool.',
      },
    ],
    related: ['potw-02-one-byte-then-silence', 'diagnose-packet-loss', 'find-what-saturates-your-wan'],
  },

  'potw-04-asymmetric-routing-stateful-drop': {
    tags: ['routing', 'security'],
    ascii: [
      '$ ping 10.20.5.10  # 0% loss',
      '$ curl :443        # hangs',
      'SYN → out via fw-A',
      'SYN-ACK ← via fw-B → no state → DROP',
      'tell: asymmetric routing + stateful fw',
    ],
    accent: 'ok',
    read: '6 min',
    faq: [
      {
        q: 'Why does ping work but TCP connections fail?',
        a: 'The most common cause is asymmetric routing through a stateful firewall. ICMP echo is not bound to TCP session state, so it succeeds in both directions, but a TCP handshake must be witnessed in full by the same stateful device. If the SYN leaves through one firewall and the SYN-ACK returns through another, the second firewall has no session for the flow and drops the out-of-state packet, so the handshake never completes even though the server replied.',
      },
      {
        q: 'What is asymmetric routing and why does it break firewalls?',
        a: 'Asymmetric routing is when traffic to a destination takes one path and the return traffic takes a different path. Stateless forwarding tolerates it, but stateful firewalls do not: they build a per-flow session table on the outbound packet and only permit return packets that match it. If the return path crosses a different firewall that never saw the connection start, that firewall drops the reply as out-of-state. It usually appears right after a second router or firewall is added for redundancy.',
      },
      {
        q: 'How do I fix asymmetric routing through a stateful firewall?',
        a: 'Best option: make routing symmetric so both directions of a flow cross the same firewall — usually a return-route or gateway change. If both paths must stay active, run the firewalls as a stateful HA pair that synchronizes its session table, or pin the flow with policy-based routing. Loosening state inspection (asymmetric/sloppy state) works on some platforms but disables a security feature to mask a routing problem, so treat it as a last resort.',
      },
    ],
    related: ['potw-03-duplicate-ip-arp-war', 'troubleshoot-slow-network-performance', 'find-what-saturates-your-wan'],
  },

  'potw-05-dhcp-snooping-blackhole': {
    tags: ['switching', 'security'],
    ascii: [
      'ipconfig → 169.254.18.44  (APIPA)',
      'next switch → 10.30.3.x  fine',
      'snooping drops (untrusted): 4012↑',
      'uplink Gi1/0/48  Trusted: NO',
      'tell: you blocked your own DHCP',
    ],
    accent: 'ok',
    read: '6 min',
    faq: [
      {
        q: 'Why do clients get a 169.254 APIPA address instead of a DHCP lease?',
        a: 'A 169.254.x.x address means the client sent a DHCP request and received no usable reply, so Windows self-assigned a link-local (APIPA) address. Causes include the DHCP server being unreachable, scope exhaustion, a missing relay/helper-address on the router for that VLAN, or DHCP snooping dropping the server\'s replies. APIPA is distinct from getting a wrong-subnet lease, which points to a rogue DHCP server instead.',
      },
      {
        q: 'What is the difference between a trusted and untrusted DHCP snooping port?',
        a: 'DHCP snooping only allows server-to-client messages — OFFER, ACK, and NAK — to arrive on trusted ports. Access ports where clients connect stay untrusted, so a rogue DHCP server plugged into one is blocked. Every port on the path toward your legitimate DHCP server or relay must be trusted. If an uplink toward the server is left untrusted, the switch drops the real server\'s offers and clients fall back to APIPA.',
      },
      {
        q: 'How do I fix DHCP snooping dropping legitimate offers?',
        a: 'Mark the uplink toward the DHCP server (or relay) as trusted. On Cisco IOS: enter the interface and run `ip dhcp snooping trust`, then confirm the untrusted-port drop counter stops climbing with `show ip dhcp snooping statistics`. The rule: access ports stay untrusted, every uplink toward the server is trusted. Reversing that on an uplink creates a DHCP black hole that mimics a rogue-server outage.',
      },
    ],
    related: ['potw-04-asymmetric-routing-stateful-drop', 'diagnose-dns-failures-fast', 'find-what-saturates-your-wan'],
  },

  'potw-06-duplex-mismatch': {
    tags: ['switching', 'troubleshooting'],
    ascii: [
      'iperf  A→B   93.6 Mb/s   ✓',
      'iperf  B→A    2.44 Mb/s  ✗',
      'core-sw  Gi1/0/48  Full-duplex',
      'acc-sw07 Gi1/0/1   Half + late-collisions',
      'tell: duplex mismatch — half side can\'t talk',
    ],
    accent: 'ok',
    read: '6 min',
    faq: [
      {
        q: 'What are the symptoms of an Ethernet duplex mismatch?',
        a: 'A duplex mismatch produces slowness that only shows up under load, and usually only in one direction. The classic fingerprint is a link that auto-negotiated down to 100 Mb/s (because one side was hard-coded), wildly asymmetric throughput, late collisions counting up on the half-duplex end, and CRC/FCS errors plus runts on the full-duplex end. Ping and low-rate traffic look perfectly fine, which is exactly why it gets misdiagnosed as a failing cable.',
      },
      {
        q: 'Why does a duplex mismatch slow down only one direction?',
        a: 'Because only the half-duplex end runs CSMA/CD. When that end transmits, the full-duplex partner sends at the same time without deferring, so the half-duplex side detects a late collision, backs off, and retransmits — collapsing the direction it sources to a trickle. The opposite direction, where the half-duplex end mostly receives, runs close to line rate. The rule of thumb: traffic flows fine until the half-duplex device has to do the talking.',
      },
      {
        q: 'How do I fix a duplex mismatch on a Cisco switch?',
        a: 'Make both ends agree. The preferred fix is to set both interfaces to `speed auto` and `duplex auto` so negotiation completes and a gigabit link can train at 1000/full. If a port must be pinned, hard-code both ends to the identical speed and duplex — never just one, because a single hard-coded end disables negotiation and forces its auto partner to fall back to half-duplex. Verify with `show interfaces`: both ends should report the same duplex and speed, and the late-collision counter should stop incrementing.',
      },
    ],
    related: ['potw-05-dhcp-snooping-blackhole', 'troubleshoot-slow-network-performance', 'diagnose-packet-loss'],
  },

  'failure-02-forgotten-hosts-file': {
    tags: ['dns', 'troubleshooting'],
    ascii: [
      '14:02  db migrated → 10.0.6.40',
      '14:03  app01: connection refused',
      'nslookup db.corp → 10.0.6.40  (right!)',
      'app still connects to 10.0.6.12',
      '[!] hosts file pinned it since 2018',
    ],
    accent: 'down',
    read: '10 min',
    faq: [
      {
        q: 'Why does my app connect to the wrong IP when DNS is correct?',
        a: 'Because the operating system resolver checks the hosts file before it ever queries DNS. A stale entry in the hosts file (Windows: C:\\Windows\\System32\\drivers\\etc\\hosts; Linux: /etc/hosts) pins a name to an old IP and the application uses it, even though DNS holds the correct record. Confirm what the app actually connects to with `netstat`, then inspect the hosts file.',
      },
      {
        q: 'Does the hosts file override DNS?',
        a: 'Yes. On both Windows and Linux the hosts file takes precedence over DNS for name resolution. On Linux the order is controlled by `nsswitch.conf`, which is typically `hosts: files dns` — files (the hosts file) first. An entry there wins absolutely, and DNS is never consulted for that name until the entry is removed.',
      },
      {
        q: 'Why does nslookup show a different IP than ping?',
        a: 'nslookup and dig are DNS tools — they query the DNS server directly and bypass the hosts file. ping uses the OS resolver, which honors the hosts file first. So when a stale hosts entry exists, nslookup returns the correct DNS record while ping (and your applications) connect to the pinned address. Whenever ping and nslookup disagree about a name, suspect a hosts-file override.',
      },
    ],
    related: ['diagnose-dns-failures-fast', 'potw-01-truncated-dns-query', 'failure-01-spanning-tree-loop-at-3am'],
  },

  'failure-03-the-outage-that-was-a-clock': {
    tags: ['security', 'troubleshooting'],
    ascii: [
      '08:31  auth failing: OWA/VPN/shares',
      'DCs up · replication healthy',
      'every error: KRB_AP_ERR_SKEW',
      'w32tm offset +2847s on the PDC',
      '[!] clock drifted 47m; Kerberos >5m = no',
    ],
    accent: 'down',
    read: '11 min',
    faq: [
      {
        q: 'Why are all users suddenly failing Kerberos authentication?',
        a: 'A common cause is clock skew. Kerberos timestamps tickets to prevent replay attacks and rejects any exchange where the two clocks differ by more than the allowable skew (5 minutes by default), logging KRB_AP_ERR_SKEW. If the PDC emulator — the domain\'s authoritative time source — drifts past that threshold, every authentication that crosses the gap to a system on correct time fails at once, even though the domain controllers and replication are perfectly healthy.',
      },
      {
        q: 'What does KRB_AP_ERR_SKEW mean?',
        a: 'KRB_AP_ERR_SKEW (Security-Kerberos Event ID 4) means the time difference between the client and the server exceeds the maximum allowable Kerberos clock skew. It is a time problem, not a password or account problem. The fix is to correct the clock — usually on the PDC emulator and its NTP source — not to touch any user account.',
      },
      {
        q: 'How much clock skew does Kerberos allow, and how do I fix a drifted PDC emulator?',
        a: 'The default maximum Kerberos clock skew is 5 minutes. To fix a drifted PDC emulator, first ensure outbound UDP/123 to an external time source is allowed, then run `w32tm /config /manualpeerlist:"time.nist.gov,0x8" /syncfromflags:manual /update`, restart the w32time service, and force a resync with `w32tm /resync /force`. Verify the offset returns to a few milliseconds with `w32tm /query /status`.',
      },
    ],
    related: ['failure-02-forgotten-hosts-file', 'failure-01-spanning-tree-loop-at-3am', 'diagnose-dns-failures-fast'],
  },

  'showdown-02-claude-vs-chatgpt-vs-gemini-netmiko': {
    tags: ['automation'],
    ascii: [
      '$ ai "netmiko: back up 50 switches"',
      '[✓] connects & pulls config',
      '[✗] password="Cisco123"  hardcoded',
      '[✗] except: pass → silent skips',
      '[!] "works" on 50, backs up 47',
    ],
    accent: 'warn',
    read: '11 min',
    faq: [
      {
        q: 'Can an AI model write a working Netmiko backup script?',
        a: 'Yes — given a detailed prompt. Modern models produce a working Netmiko script that reads an inventory, pulls the running-config, and saves it. The gaps appear on vague prompts: they tend to hardcode credentials, wrap the whole loop in one try/except so a single failure aborts everything, or swallow errors so unreachable devices vanish from the run. Always grade the output against a fixed checklist before trusting it in cron.',
      },
      {
        q: 'What is the most common mistake in AI-generated automation scripts?',
        a: 'Silently swallowing failures — an `except: pass` or a generic handler that prints nothing. The script backs up the reachable devices and quietly drops the ones it could not reach, so a run that missed three switches looks identical to one that succeeded. The second most common mistake is hardcoding credentials directly in the source, which then gets committed to version control.',
      },
      {
        q: 'How do I handle credentials safely in a Netmiko script?',
        a: 'Never hardcode them. Read the username and password from environment variables, a secrets manager, or an interactive `getpass` prompt (which does not echo). Keep the inventory file (hosts and device types) separate from credentials, and make sure neither secrets nor backed-up configs are committed to a public repository. Pair this with per-device error handling so one bad login does not abort the whole job.',
      },
    ],
    related: ['showdown-01-claude-vs-chatgpt-vs-gemini-bgp', 'ai-generate-network-configs', 'using-claude-to-audit-firewall-rules'],
  },

  'migration-fortigate-to-opnsense': {
    tags: ['firewalls'],
    ascii: [
      'FORTIGATE          →   OPNsense',
      'firewall policy    →   Rule + NAT + UTM',
      'UTM profiles       →   Suricata / proxy',
      'SD-WAN rules       →   gateway groups',
      '[!] 1 policy = 4 OPNsense objects',
    ],
    accent: 'accent',
    read: '13 min',
    faq: [
      {
        q: 'Can I migrate a FortiGate configuration to OPNsense?',
        a: 'Yes, but it is a decomposition, not a one-to-one port. A single FortiGate firewall policy bundles filtering, NAT, threat inspection (AV/IPS/web/app control), and logging. OPNsense splits those across separate firewall rules, NAT settings, and plugins (Suricata, web proxy, Zenarmor). Address and service objects map cleanly to Aliases; VDOMs and the integrated UTM stack do not map directly and need redesign.',
      },
      {
        q: 'What is the hardest part of a FortiGate to OPNsense migration?',
        a: 'Unbundling the all-in-one firewall policy without losing the security inspection it performed. Because OPNsense filtering, NAT, and UTM live in different places, it is easy to translate the filter rule, see traffic flow, and never notice the antivirus, IPS, and web filtering are gone. Rebuilding SD-WAN path selection from gateway groups and policy routing, and reproducing SSL deep inspection, are the next hardest pieces.',
      },
      {
        q: 'Does OPNsense replace FortiGate UTM and FortiClient VPN?',
        a: 'OPNsense covers most FortiGate UTM functions, but as separate plugins rather than one integrated stack: Suricata for IDS/IPS, a web proxy for category filtering, and Zenarmor/Sensei for application-aware L7 control — each installed and tuned independently. FortiClient SSL VPN is not supported; OPNsense uses OpenVPN or WireGuard instead, so every remote user installs a new client and profile.',
      },
    ],
    related: ['migration-cisco-asa-to-pfsense', 'using-claude-to-audit-firewall-rules', 'ai-generate-network-configs'],
  },

  'acr-02-pfsense-nat-from-the-wild': {
    tags: ['firewalls', 'security'],
    ascii: [
      'NAT ▸ Port Forward (from an AI)',
      '  Source: any        [!] the internet',
      '  Dest WAN:3389 → 192.168.10.10',
      '  +assoc rule: WAN any → :3389 PASS',
      'verdict: RDP on the internet',
    ],
    accent: 'info',
    read: '8 min',
    faq: [
      {
        q: 'Is it safe to port forward RDP (port 3389) on pfSense?',
        a: 'No. Publishing RDP/3389 directly to the WAN exposes it to internet-wide scanning and automated brute-force, and it has a history of wormable pre-auth vulnerabilities. A port forward with Source set to "any" is the highest-risk version. The safe pattern is to put remote access behind a VPN (WireGuard or OpenVPN) and reach RDP only over the tunnel, so the jump box is never reachable from the public internet.',
      },
      {
        q: 'How should I allow remote RDP access securely?',
        a: 'Run a VPN on the firewall (WireGuard or OpenVPN), expose only the VPN port on the WAN, and RDP to the internal host across the tunnel. Delete any direct 3389 port forward. If a port forward is genuinely unavoidable, restrict the Source to an alias of known admin IP addresses, enable logging on the rule, and document it — but a VPN is less work than the incident an exposed RDP invites.',
      },
      {
        q: 'Why is exposing port 3389 to the internet dangerous?',
        a: 'Port 3389 (Microsoft RDP) is one of the most heavily scanned and exploited ports on the internet. An exposed endpoint faces continuous credential brute-force and stuffing, and RDP has had wormable pre-authentication vulnerabilities such as BlueKeep. A single weak or reused password on an exposed jump box can hand an attacker interactive access to an internal host — which is why RDP exposure is a leading ransomware entry vector.',
      },
    ],
    related: ['acr-01-reddit-bgp-configs', 'using-claude-to-audit-firewall-rules', 'migration-cisco-asa-to-pfsense'],
  },
};
