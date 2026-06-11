// PacketPilot AI — "Claude × Network Engineering" roadmap.
// Single source of truth for the interactive roadmap artifact (/roadmap).
//
// Each node is one skill/topic. `postSlug` links to a published guide at /blog/<slug>/;
// nodes without a postSlug are prompt-only (the validated content backlog — write the guide,
// then add the slug here and the node upgrades automatically).
//
// Design note: this data is renderer-agnostic. The current renderer is a skill-tree console
// (Roadmap.tsx). A future topology-map view can consume the same structure without a rewrite.

export type RoadmapNode = {
  id: string;          // stable id — used as the localStorage progress key, never reuse
  label: string;       // display label
  blurb: string;       // one-line description shown in the console panel
  postSlug?: string;   // if present, links to /blog/<slug>/
  prompt: string;      // copy-paste Claude prompt for this task
};

export type RoadmapDomain = {
  key: string;
  name: string;        // section name
  glyph: string;       // terminal-native marker
  nodes: RoadmapNode[];
};

export const ROADMAP: RoadmapDomain[] = [
  {
    key: 'foundations',
    name: 'Foundations',
    glyph: '[01]',
    nodes: [
      {
        id: 'osi-methodology',
        label: 'OSI & troubleshooting methodology',
        blurb: 'Work any network fault bottom-up instead of guessing. The discipline that makes everything below it faster.',
        postSlug: 'troubleshoot-slow-network-performance',
        prompt: `Act as a senior network engineer. Symptom: [e.g. intermittent slowness on the 10.0.4.0/24 VLAN]. Walk the OSI stack bottom-up and give me the exact CLI command to check at each layer (L1 cabling/errors -> L2 STP/duplex -> L3 MTU/routing -> L4 TCP retransmissions). Stop at the first layer showing a fault and explain why.`,
      },
      {
        id: 'subnetting',
        label: 'Subnetting & CIDR',
        blurb: 'VLSM, address planning, and reading a prefix at a glance. The math you must not get wrong.',
        prompt: `Given the supernet [10.0.0.0/16] and these site host counts [HQ: 500, Branch-A: 60, Branch-B: 25, point-to-point links: 2 each], design a VLSM subnet plan. Output a table: subnet, CIDR, mask, usable range, host count. Most-efficient allocation, no overlaps.`,
      },
      {
        id: 'packet-capture',
        label: 'Packet capture & analysis',
        blurb: 'See what is actually on the wire. tcpdump/Wireshark filters that isolate the problem instead of drowning you.',
        postSlug: '5-free-network-troubleshooting-tools-2026',
        prompt: `Write a single tcpdump (and the equivalent Wireshark display) filter that captures only [traffic of interest, e.g. DNS queries from 10.0.4.42 that get no response within 2s]. Explain each filter token, then give the follow-up filter to isolate the retransmissions.`,
      },
    ],
  },
  {
    key: 'l2',
    name: 'Layer 2 — Switching',
    glyph: '[02]',
    nodes: [
      {
        id: 'vlans',
        label: 'VLANs & trunking',
        blurb: 'Segmentation, access vs trunk ports, native-VLAN gotchas, and verifying a trunk actually negotiated.',
        prompt: `Generate the Cisco IOS config to create VLAN [10 = GUEST], assign access ports [Gi0/5-10], and trunk [Gi0/24] carrying VLANs [10,20,30] with native VLAN [99]. Include the show commands to verify the trunk negotiated correctly.`,
      },
      {
        id: 'stp',
        label: 'Spanning Tree (STP/RSTP)',
        blurb: 'Root election, blocking states, and the bpdufilter/bpduguard mistakes that take a network down at 3am.',
        postSlug: 'failure-01-spanning-tree-loop-at-3am',
        prompt: `Here is my "show spanning-tree" output: [paste]. Identify the root bridge, any unexpected blocking/forwarding states, and whether bpdufilter/bpduguard is creating a loop risk. Then give the single command to make [SW-CORE] the deterministic root bridge.`,
      },
      {
        id: 'l1-loss',
        label: 'Physical layer & packet loss',
        blurb: 'Classify loss as cabling, duplex, congestion, or SFP from the interface counters — not by swapping cables blindly.',
        postSlug: 'diagnose-packet-loss',
        prompt: `I see [17%] packet loss on [Gi0/4]. Here is "show interfaces Gi0/4": [paste]. Classify the root cause as cabling, duplex mismatch, congestion, or failing SFP based on which counters are incrementing (CRC, input errors, output drops, collisions) and give the fix.`,
      },
    ],
  },
  {
    key: 'routing',
    name: 'Layer 3 — Routing',
    glyph: '[03]',
    nodes: [
      {
        id: 'ip-routing',
        label: 'IP routing fundamentals',
        blurb: 'Longest-prefix match, static vs dynamic, and why traffic takes the path it takes.',
        prompt: `Explain why traffic from [10.0.4.10] to [10.0.9.20] is [taking the wrong path / blackholing]. Here is "show ip route": [paste]. Identify the matching route, any more-specific/less-specific conflicts, and the exact static or dynamic change to fix it.`,
      },
      {
        id: 'ospf',
        label: 'OSPF',
        blurb: 'Areas, adjacencies, and the classic reasons two routers never become neighbors.',
        prompt: `Two OSPF neighbors are stuck in [EXSTART / 2-WAY]: [paste "show ip ospf neighbor" + relevant config]. List the usual suspects (MTU mismatch, area/network-type mismatch, mismatched timers, authentication) in priority order, with the command to confirm each.`,
      },
      {
        id: 'bgp',
        label: 'BGP',
        blurb: 'eBGP/iBGP, session states, and path selection — the protocol that runs the internet and breaks quietly.',
        prompt: `My eBGP session to [AS65001, peer 203.0.113.1] is [stuck in Active/Idle]. Here is the config + "show ip bgp summary": [paste]. Diagnose it (TCP/179 reachability, AS number mismatch, missing neighbor statement, ACL/firewall) and give the verification commands in order.`,
      },
      {
        id: 'nat',
        label: 'NAT & PAT',
        blurb: 'Inside/outside translation, 1:1 statics, and port forwarding done right on IOS and pfSense.',
        prompt: `Write the [Cisco IOS / pfSense] config to PAT the inside network [10.0.0.0/24] out interface [Gi0/0], plus a static 1:1 NAT for the web server [10.0.0.50 -> 198.51.100.50] on ports [80,443]. Include the verify commands.`,
      },
    ],
  },
  {
    key: 'services',
    name: 'Core Services',
    glyph: '[04]',
    nodes: [
      {
        id: 'dns',
        label: 'DNS resolution & failures',
        blurb: 'Resolver chains, query latency, and the UDP->TCP fallback that breaks when TCP/53 is blocked.',
        postSlug: 'diagnose-dns-failures-fast',
        prompt: `Resolution of [corp.local] is [slow / failing] from [10.0.4.42]. Here is "dig @resolver corp.local +stats": [paste]. From the query time and flags, tell me whether it is the resolver, the forwarder chain, or a TCP/53 fallback block, and the single test to confirm.`,
      },
      {
        id: 'dhcp',
        label: 'DHCP & relay',
        blurb: 'Scopes, lease problems, and why ip helper-address silently fails across an SVI.',
        prompt: `Clients on VLAN [20] are not getting addresses. The DHCP server is [10.0.1.5] reached across an SVI. Give me the ip helper-address config, the relay verification commands, and the top 3 reasons DHCP relay fails silently.`,
      },
    ],
  },
  {
    key: 'performance',
    name: 'Performance',
    glyph: '[05]',
    nodes: [
      {
        id: 'wan-bandwidth',
        label: 'WAN, bandwidth & NetFlow',
        blurb: 'Find the top talker saturating the link before users do. Flow data turns "the internet is slow" into a named host.',
        postSlug: 'find-what-saturates-your-wan',
        prompt: `My [100Mbps] WAN saturates every night at [01:00]. Here is the top-talkers NetFlow export: [paste]. Identify the offending host/app, tell me whether it is backup/replication/update traffic, and the QoS or scheduling change to fix it.`,
      },
      {
        id: 'qos',
        label: 'QoS & traffic shaping',
        blurb: 'Protect voice and business-critical traffic on a congested link with markings that actually hold.',
        prompt: `Design a 3-class QoS policy (voice / business-critical / scavenger) for a [50Mbps] WAN link on [Cisco IOS]. Give the class-maps, the policy-map with bandwidth/priority percentages, where to apply it, and explain the DSCP markings.`,
      },
    ],
  },
  {
    key: 'security',
    name: 'Security',
    glyph: '[06]',
    nodes: [
      {
        id: 'firewall',
        label: 'Firewall rule audits',
        blurb: 'Hunt shadowed rules, any/any permits, and missing egress filtering before an auditor (or attacker) does.',
        postSlug: 'using-claude-to-audit-firewall-rules',
        prompt: `Audit this [pfSense / Cisco ASA] ruleset for shadowed rules, any/any permits, and missing egress filtering: [paste]. Output a table: rule #, issue, severity, fix. Flag any rule that can never be matched.`,
      },
      {
        id: 'acls',
        label: 'ACLs & rule hygiene',
        blurb: 'Translate intent into correct, ordered ACLs — and apply them in the right direction.',
        prompt: `Convert this requirement into a [Cisco IOS] extended ACL: "permit [10.0.0.0/24] to [web servers 10.0.5.0/28] on 80/443, permit established return traffic, deny and log everything else." Then tell me the correct interface and direction to apply it.`,
      },
      {
        id: 'vpn-ipsec',
        label: 'VPN & IPSec',
        blurb: 'Phase 1 vs phase 2, proposal mismatches, and the traffic-selector errors that keep a tunnel half-up.',
        prompt: `My site-to-site IPSec tunnel to [peer 198.51.100.2] is [up on phase 1, down on phase 2]. Here are both configs: [paste]. Compare the phase-2 proposals (encryption, PFS group, lifetime, traffic selectors) and tell me the exact mismatch.`,
      },
    ],
  },
  {
    key: 'ai-automation',
    name: 'AI · Automation',
    glyph: '[07]',
    nodes: [
      {
        id: 'ai-config-gen',
        label: 'AI config generation',
        blurb: 'Turn plain-English intent into paste-ready config — with the assumptions flagged so you catch the hallucinations.',
        postSlug: 'ai-generate-network-configs',
        prompt: `Generate a [Cisco IOS] config for [requirement in plain English]. Output ONLY the config, paste-ready, with a one-line comment above each block. Then list everything you assumed or that I must verify before applying this to production.`,
      },
      {
        id: 'prompt-patterns',
        label: 'Prompt patterns for networking',
        blurb: 'The reusable structure that makes Claude reliable on network tasks. This is exactly what the pack systematizes.',
        postSlug: 'claude-prompt-pack-network-admins',
        prompt: `Here is a networking task: [task]. Rewrite my request as a high-quality prompt for you — add the device platform, software version, interface names, constraints, and the output format I should ask for — then answer it.`,
      },
      {
        id: 'no-ai-zones',
        label: 'When NOT to use AI',
        blurb: 'The failure modes where an LLM is dangerous on a network. Knowing the boundary is the senior move.',
        prompt: `I am about to use AI for [networking task]. Play devil's advocate: list the failure modes where an LLM is dangerous here (hallucinated CLI flags, software-version drift, no real-time device state, stateful-inspection logic) and tell me whether this task is safe to automate or should stay human-only.`,
      },
      {
        id: 'python-automation',
        label: 'Python automation (Netmiko/NAPALM)',
        blurb: 'Push past one-device-at-a-time. Scripted collection and change with error handling and a dry run.',
        prompt: `Write a [Netmiko / NAPALM] Python script that connects to [list of devices], runs [show command], parses [field] with TextFSM or regex, and writes CSV. Include connection error handling and a --dry-run flag.`,
      },
    ],
  },
];

export const ROADMAP_NODE_COUNT = ROADMAP.reduce((n, d) => n + d.nodes.length, 0);

export const ROADMAP_POST_COUNT = ROADMAP.reduce(
  (n, d) => n + d.nodes.filter((node) => node.postSlug).length,
  0,
);
