import * as fs from 'fs';
import * as path from 'path';

export type DependencyType = 'critical' | 'optional';
export type ServiceSeverity = 'failed' | 'degraded' | 'healthy';
export type FailureType = 'unavailable' | 'latency' | 'database_down';

export interface ImpactOptions {
  failureType?: FailureType;
}

export interface Dependency {
  name?: string;
  target?: string;
  type: DependencyType;
}

export interface ServiceNode {
  name: string;
  dependsOn: Dependency[];
}

export interface Topology {
  services: Record<string, ServiceNode> | any[];
}

export interface ImpactedService {
  serviceId: string;
  name: string;
  severity: ServiceSeverity;
  status: ServiceSeverity;
  order: number;
}

export interface ImpactResult {
  failedService: string;
  affectedServices: ImpactedService[];
  impactOrder: string[];
}

export function loadTopology(): Topology {
  const filePath = path.join(__dirname, 'topology.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

export function analyzeImpact(failedService: string, topologyData?: Topology, options?: ImpactOptions): ImpactResult {
  const topology = topologyData || loadTopology();
  const failureType = options?.failureType || 'unavailable';

  let servicesMap: Record<string, ServiceNode> = {};
  if (Array.isArray(topology.services)) {
    topology.services.forEach((s: any) => {
      servicesMap[s.id || s.name] = {
        name: s.id || s.name,
        dependsOn: (s.dependsOn || []).map((d: any) => ({
          name: d.name || d.target,
          type: d.type || 'critical'
        }))
      };
    });
  } else if (topology.services && typeof topology.services === 'object') {
    for (const [k, v] of Object.entries(topology.services) as [string, any][]) {
      servicesMap[k] = {
        name: v.name || k,
        dependsOn: (v.dependsOn || []).map((d: any) => ({
          name: d.name || d.target,
          type: d.type || 'critical'
        }))
      };
    }
  }

  if (!servicesMap[failedService]) {
    throw new Error(`Service '${failedService}' not found in topology.`);
  }

  const dependents: Record<string, { name: string; type: DependencyType }[]> = {};
  for (const name of Object.keys(servicesMap)) {
    dependents[name] = [];
  }

  for (const [serviceName, node] of Object.entries(servicesMap)) {
    for (const dep of node.dependsOn) {
      const depName = dep.name || dep.target;
      if (depName && dependents[depName]) {
        dependents[depName].push({ name: serviceName, type: dep.type });
      }
    }
  }

  const resultsMap: Map<string, ServiceSeverity> = new Map();
  const q: { name: string; severity: ServiceSeverity }[] = [];

  const initialSeverity: ServiceSeverity = failureType === 'latency' ? 'degraded' : 'failed';

  resultsMap.set(failedService, initialSeverity);
  q.push({ name: failedService, severity: initialSeverity });

  const impactOrder: string[] = [];

  while (q.length > 0) {
    const current = q.shift()!;
    
    if (failureType !== 'latency' && current.severity !== 'failed') continue;

    const currentDependents = dependents[current.name] || [];

    for (const dep of currentDependents) {
      const existingSeverity = resultsMap.get(dep.name);
      
      let newSeverity: ServiceSeverity = 'healthy';
      if (failureType === 'latency') {
        newSeverity = 'degraded';
      } else {
        if (dep.type === 'critical') {
          newSeverity = 'failed';
        } else if (dep.type === 'optional') {
          newSeverity = 'degraded';
        }
      }

      if (existingSeverity === 'failed') continue;
      if (existingSeverity === 'degraded' && newSeverity === 'degraded') continue;
      
      if (!existingSeverity || (existingSeverity === 'degraded' && newSeverity === 'failed')) {
        resultsMap.set(dep.name, newSeverity);
        impactOrder.push(dep.name);
        q.push({ name: dep.name, severity: newSeverity });
      }
    }
  }

  const uniqueImpactOrder = Array.from(new Set(impactOrder));
  const affectedServices: ImpactedService[] = [];
  
  for (const [name, severity] of resultsMap.entries()) {
    if (name !== failedService) {
      const orderIdx = uniqueImpactOrder.indexOf(name);
      affectedServices.push({
        serviceId: name,
        name,
        severity,
        status: severity,
        order: orderIdx !== -1 ? orderIdx + 1 : 99
      });
    }
  }

  return {
    failedService,
    affectedServices,
    impactOrder: uniqueImpactOrder
  };
}
