// CIDR 网段解析（F-DISC-2 第二板斧：网段定向扫描）。
// 只支持 IPv4；最多展开 1024 个主机地址（/22 及更小），防误填大段打爆网络。

export const SCAN_MAX_HOSTS = 1024

interface ParsedCidr {
  prefix: number
  network: number
  hostCount: number
}

export interface CidrHostPlan {
  hosts: string[]
  rangeCount: number
}

function parseCidrBase(input: string): ParsedCidr | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(input.trim())
  if (!m) return null
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
  const prefix = Number(m[5])
  if (octets.some((o) => o > 255) || prefix < 8 || prefix > 30) return null

  const hostBits = 32 - prefix
  const hostCount = 2 ** hostBits - 2 // 去掉网络地址与广播地址
  if (hostCount <= 0 || hostCount > SCAN_MAX_HOSTS) return null

  const base =
    ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const network = (base >> hostBits << hostBits) >>> 0
  return { prefix, network, hostCount }
}

function formatIpv4(addr: number): string {
  return `${(addr >>> 24) & 0xff}.${(addr >>> 16) & 0xff}.${(addr >>> 8) & 0xff}.${addr & 0xff}`
}

export function normalizeCidr(input: string): string | null {
  const parsed = parseCidrBase(input)
  if (!parsed) return null
  return `${formatIpv4(parsed.network)}/${parsed.prefix}`
}

export function parseCidr(input: string): string[] | null {
  const parsed = parseCidrBase(input)
  if (!parsed) return null
  const hosts: string[] = []
  for (let i = 1; i <= parsed.hostCount; i++) {
    const addr = (parsed.network + i) >>> 0
    hosts.push(formatIpv4(addr))
  }
  return hosts
}

export function buildCidrHostPlan(inputs: string[]): CidrHostPlan {
  const seenRanges = new Set<string>()
  const seenHosts = new Set<string>()
  const hosts: string[] = []
  for (const input of inputs) {
    const cidr = normalizeCidr(input)
    if (!cidr || seenRanges.has(cidr)) continue
    const parsed = parseCidr(cidr)
    if (!parsed) continue
    seenRanges.add(cidr)
    for (const host of parsed) {
      if (seenHosts.has(host)) continue
      seenHosts.add(host)
      hosts.push(host)
    }
  }
  return { hosts, rangeCount: seenRanges.size }
}

/**
 * 判断 IPv4 地址是否落在 CIDR 网段内（决议 #160：统计网段在线节点数用）。
 * 非法 IP 或非法/超界 CIDR 一律返回 false。
 */
export function ipInCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidrBase(cidr)
  if (!parsed) return false
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim())
  if (!m) return false
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
  if (octets.some((o) => o > 255)) return false
  const addr = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const mask = (0xffffffff << (32 - parsed.prefix)) >>> 0
  return ((addr & mask) >>> 0) === parsed.network
}
