import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { RedisService } from '@/common/redis/redis.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('active_users')
    private readonly activeUsers: Gauge<string>,
    @InjectMetric('queue_jobs_total')
    private readonly queueJobsTotal: Counter<string>,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async getMetrics(): Promise<string> {
    // Collect all metrics
    const metrics = await Promise.all([
      this.httpRequestsTotal.get(),
      this.httpRequestDuration.get(),
      this.activeUsers.get(),
      this.queueJobsTotal.get(),
    ]);

    // Format as Prometheus text format
    return this.formatMetrics(metrics);
  }

  private formatMetrics(metrics: any[]): string {
    const lines: string[] = [];

    // HTTP Requests Total
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    for (const metric of metrics[0]) {
      const labels = Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(`http_requests_total${labels ? `{${labels}}` : ''} ${metric.value}`);
    }

    // HTTP Request Duration
    lines.push('# HELP http_request_duration_seconds HTTP request duration');
    lines.push('# TYPE http_request_duration_seconds histogram');
    for (const metric of metrics[1]) {
      const labels = Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      const suffix = labels ? `{${labels}}` : '';

      lines.push(`http_request_duration_seconds_bucket${suffix} ${metric.buckets?.le || 0}`);
      lines.push(`http_request_duration_seconds_sum${suffix} ${metric.sum || 0}`);
      lines.push(`http_request_duration_seconds_count${suffix} ${metric.count || 0}`);
    }

    // Active Users
    lines.push('# HELP active_users Number of active users');
    lines.push('# TYPE active_users gauge');
    for (const metric of metrics[2]) {
      const labels = Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(`active_users${labels ? `{${labels}}` : ''} ${metric.value}`);
    }

    // Queue Jobs Total
    lines.push('# HELP queue_jobs_total Total queue jobs');
    lines.push('# TYPE queue_jobs_total counter');
    for (const metric of metrics[3]) {
      const labels = Object.entries(metric.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(`queue_jobs_total${labels ? `{${labels}}` : ''} ${metric.value}`);
    }

    const cacheStats = this.redisService.getCacheStats();
    lines.push('# HELP cache_hits_total Total cache hits recorded by RedisService JSON reads');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${cacheStats.hits}`);
    lines.push('# HELP cache_misses_total Total cache misses recorded by RedisService JSON reads');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${cacheStats.misses}`);
    lines.push('# HELP cache_hit_rate Cache hit ratio recorded by RedisService JSON reads');
    lines.push('# TYPE cache_hit_rate gauge');
    lines.push(`cache_hit_rate ${cacheStats.hitRate}`);

    return lines.join('\n');
  }
}
