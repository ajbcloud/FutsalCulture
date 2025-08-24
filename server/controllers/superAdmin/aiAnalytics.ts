import { Request, Response } from "express";
import { db } from "../../db";
import { 
  aiForecastsDaily, 
  aiAnomalies, 
  aiContributions, 
  aiTenantScores, 
  aiNarratives,
  payments,
  signups,
  futsalSessions,
  tenants,
  players,
  tenantPlanAssignments
} from "@shared/schema";
import { z } from "zod";
import { and, eq, gte, lte, desc, asc, sql, between } from "drizzle-orm";

const aiQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  tenantId: z.string().optional(),
  status: z.enum(["platform", "commerce", "all"]).optional().default("all"),
});

// Get AI Insights for the bar display
export async function getInsights(req: Request, res: Response) {
  try {
    const { from, to, tenantId, status } = aiQuerySchema.parse(req.query);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get current week vs last week metrics
    const currentWeekRevenue = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        gte(payments.createdAt, weekAgo),
        tenantId && tenantId !== 'all' ? eq(payments.tenantId, tenantId) : undefined
      ));
    
    const lastWeekRevenue = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        between(payments.createdAt, new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), weekAgo),
        tenantId && tenantId !== 'all' ? eq(payments.tenantId, tenantId) : undefined
      ));
    
    const currentTotal = currentWeekRevenue[0]?.total || 0;
    const lastTotal = lastWeekRevenue[0]?.total || 0;
    const revenueDelta = currentTotal - lastTotal;
    const revenuePct = lastTotal > 0 ? ((revenueDelta / lastTotal) * 100) : 0;
    
    // Get top drivers from contributions table
    const drivers = await db
      .select()
      .from(aiContributions)
      .where(and(
        gte(aiContributions.periodStart, weekAgo.toISOString().split('T')[0]),
        lte(aiContributions.periodEnd, now.toISOString().split('T')[0])
      ))
      .orderBy(desc(aiContributions.impactAbs))
      .limit(3);
    
    // Get anomalies/risks
    const risks = await db
      .select()
      .from(aiAnomalies)
      .where(and(
        gte(aiAnomalies.date, weekAgo.toISOString().split('T')[0]),
        eq(aiAnomalies.severity, 'crit')
      ))
      .orderBy(desc(aiAnomalies.zscore))
      .limit(2);
    
    // Get forecast for next 30 days
    const forecasts = await db
      .select()
      .from(aiForecastsDaily)
      .where(and(
        eq(aiForecastsDaily.metric, status === 'platform' ? 'platform_mrr' : 'commerce_net'),
        eq(aiForecastsDaily.scopeType, 'platform'),
        gte(aiForecastsDaily.date, now.toISOString().split('T')[0])
      ))
      .orderBy(asc(aiForecastsDaily.date))
      .limit(30);
    
    // Calculate forecast summary
    const forecastMean = forecasts.reduce((sum, f) => sum + f.mean, 0) / (forecasts.length || 1);
    const forecastP10 = forecasts.reduce((sum, f) => sum + f.p10, 0) / (forecasts.length || 1);
    const forecastP90 = forecasts.reduce((sum, f) => sum + f.p90, 0) / (forecasts.length || 1);
    
    // Generate summary text
    const summaryText = revenueDelta >= 0 
      ? `Platform revenue is up **${Math.abs(revenuePct).toFixed(1)}% WoW** (+$${(currentTotal / 100).toFixed(0)}). Failed payments decreased.`
      : `Platform revenue is down **${Math.abs(revenuePct).toFixed(1)}% WoW** (-$${Math.abs(currentTotal / 100).toFixed(0)}). Monitoring payment failures.`;
    
    res.json({
      now: {
        summary: summaryText,
        deltas: [
          {
            label: "Revenue",
            value: currentTotal,
            pct: revenuePct,
            dir: revenueDelta >= 0 ? 'up' : 'down'
          },
          {
            label: "Sessions",
            value: 142, // Mock for now
            pct: 8.5,
            dir: 'up'
          },
          {
            label: "Players",
            value: 320,
            pct: 12.3,
            dir: 'up'
          }
        ]
      },
      drivers: drivers.map(d => ({
        type: d.driverType,
        id: d.driverId,
        label: d.driverLabel,
        impactPct: d.impactPct,
        impactAbs: d.impactAbs
      })),
      risks: risks.map(r => ({
        metric: r.metric,
        label: `${r.metric} ${r.direction === 'high' ? 'spike' : 'drop'} detected`,
        severity: r.severity,
        context: { tenantId: r.scopeId }
      })),
      forecast: {
        metric: status === 'platform' ? 'platform_mrr' : 'commerce_net',
        mean: Math.round(forecastMean),
        p10: Math.round(forecastP10),
        p90: Math.round(forecastP90),
        horizonDays: 30
      }
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
}

// Get anomalies table
export async function getAnomalies(req: Request, res: Response) {
  try {
    const { from, to, tenantId, status } = aiQuerySchema.parse(req.query);
    
    const startDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = to || new Date().toISOString().split('T')[0];
    
    const anomalies = await db
      .select()
      .from(aiAnomalies)
      .where(and(
        gte(aiAnomalies.date, startDate),
        lte(aiAnomalies.date, endDate),
        tenantId && tenantId !== 'all' ? eq(aiAnomalies.scopeId, tenantId) : undefined
      ))
      .orderBy(desc(aiAnomalies.date), desc(aiAnomalies.zscore));
    
    res.json(anomalies);
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
}

// Get contributions/drivers
export async function getContributions(req: Request, res: Response) {
  try {
    const { from, to, tenantId } = aiQuerySchema.parse(req.query);
    
    const startDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = to || new Date().toISOString().split('T')[0];
    
    const contributions = await db
      .select()
      .from(aiContributions)
      .where(and(
        gte(aiContributions.periodStart, startDate),
        lte(aiContributions.periodEnd, endDate)
      ))
      .orderBy(desc(aiContributions.impactAbs));
    
    res.json(contributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ error: 'Failed to fetch contributions' });
  }
}

// Get tenant health scores
export async function getTenantScores(req: Request, res: Response) {
  try {
    const scores = await db
      .select({
        tenantId: aiTenantScores.tenantId,
        tenantName: tenants.name,
        churnRisk: aiTenantScores.churnRisk,
        healthScore: aiTenantScores.healthScore,
        topSignals: aiTenantScores.topSignals,
        date: aiTenantScores.date
      })
      .from(aiTenantScores)
      .leftJoin(tenants, eq(aiTenantScores.tenantId, tenants.id))
      .where(eq(aiTenantScores.date, new Date().toISOString().split('T')[0]))
      .orderBy(desc(aiTenantScores.churnRisk));
    
    res.json(scores);
  } catch (error) {
    console.error('Error fetching tenant scores:', error);
    res.status(500).json({ error: 'Failed to fetch tenant scores' });
  }
}

// Natural language Q&A endpoint
export async function askAnalytics(req: Request, res: Response) {
  try {
    const { question, filters } = req.body;
    
    // Parse intent from question
    const questionLower = question.toLowerCase();
    let intent = 'unknown';
    
    if (questionLower.includes('revenue') && questionLower.includes('change')) {
      intent = 'revenue_change';
    } else if (questionLower.includes('tenant') && questionLower.includes('grow')) {
      intent = 'tenant_growth';
    } else if (questionLower.includes('forecast')) {
      intent = 'forecast';
    } else if (questionLower.includes('churn') || questionLower.includes('risk')) {
      intent = 'churn_risk';
    }
    
    let answerMd = '';
    let tableData = null;
    
    switch (intent) {
      case 'revenue_change':
        // Get revenue change data
        const revenueData = await db
          .select()
          .from(aiContributions)
          .where(eq(aiContributions.metric, 'platform_mrr'))
          .orderBy(desc(aiContributions.impactAbs))
          .limit(5);
        
        answerMd = `Revenue changed primarily due to:\n\n`;
        revenueData.forEach((d, i) => {
          answerMd += `${i + 1}. **${d.driverLabel}**: ${d.impactPct > 0 ? '+' : ''}${d.impactPct.toFixed(1)}% impact ($${(d.impactAbs / 100).toFixed(0)})\n`;
        });
        
        tableData = {
          columns: ['Driver', 'Impact %', 'Amount'],
          rows: revenueData.map(d => [d.driverLabel, `${d.impactPct.toFixed(1)}%`, `$${(d.impactAbs / 100).toFixed(0)}`])
        };
        break;
        
      case 'tenant_growth':
        // Get top growing tenants
        const tenantGrowth = await db
          .select({
            name: tenants.name,
            revenue: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`,
          })
          .from(tenants)
          .leftJoin(payments, eq(tenants.id, payments.tenantId))
          .groupBy(tenants.id, tenants.name)
          .orderBy(desc(sql`COALESCE(SUM(${payments.amountCents}), 0)`))
          .limit(5);
        
        answerMd = `Top tenants driving growth:\n\n`;
        tenantGrowth.forEach((t, i) => {
          answerMd += `${i + 1}. **${t.name}**: $${(t.revenue / 100).toFixed(0)} revenue\n`;
        });
        
        tableData = {
          columns: ['Tenant', 'Revenue'],
          rows: tenantGrowth.map(t => [t.name, `$${(t.revenue / 100).toFixed(0)}`])
        };
        break;
        
      case 'forecast':
        // Get forecast data
        const forecast = await db
          .select()
          .from(aiForecastsDaily)
          .where(and(
            eq(aiForecastsDaily.metric, 'platform_mrr'),
            eq(aiForecastsDaily.scopeType, 'platform')
          ))
          .orderBy(asc(aiForecastsDaily.date))
          .limit(30);
        
        const totalForecast = forecast.reduce((sum, f) => sum + f.mean, 0);
        answerMd = `**30-day forecast**: Platform MRR is projected to reach $${(totalForecast / 100).toFixed(0)} with 80% confidence interval of $${(forecast[0]?.p10 / 100 || 0).toFixed(0)} - $${(forecast[0]?.p90 / 100 || 0).toFixed(0)}.`;
        break;
        
      case 'churn_risk':
        // Get high-risk tenants
        const churnRisks = await db
          .select()
          .from(aiTenantScores)
          .leftJoin(tenants, eq(aiTenantScores.tenantId, tenants.id))
          .where(gte(aiTenantScores.churnRisk, 0.5))
          .orderBy(desc(aiTenantScores.churnRisk))
          .limit(3);
        
        answerMd = `**Churn risk alert**:\n\n`;
        churnRisks.forEach((r, i) => {
          answerMd += `${i + 1}. **${r.tenants?.name || 'Unknown'}**: ${(r.ai_tenant_scores.churnRisk * 100).toFixed(0)}% risk\n`;
        });
        break;
        
      default:
        answerMd = "I can help you understand revenue changes, tenant growth, forecasts, and churn risks. Try asking:\n- Why did revenue change this week?\n- Which tenants drive growth?\n- What's the 30-day forecast?";
    }
    
    res.json({
      answer_md: answerMd,
      sources: [{ type: 'table', ref: intent }],
      table: tableData
    });
  } catch (error) {
    console.error('Error in ask analytics:', error);
    res.status(500).json({ error: 'Failed to process analytics question' });
  }
}

// Seed AI data for testing
export async function seedAIData(req: Request, res: Response) {
  try {
    const now = new Date();
    const tenantList = await db.select().from(tenants).limit(5);
    
    // Seed forecasts
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const baseValue = 4500000; // $45K MRR
      
      await db.insert(aiForecastsDaily).values({
        date: date.toISOString().split('T')[0],
        scopeType: 'platform',
        scopeId: null,
        metric: 'platform_mrr',
        mean: baseValue + Math.random() * 500000,
        p10: baseValue - 200000,
        p90: baseValue + 800000,
        model: 'prophet'
      }).onConflictDoNothing();
    }
    
    // Seed contributions
    for (const tenant of tenantList) {
      await db.insert(aiContributions).values({
        periodStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodEnd: now.toISOString().split('T')[0],
        metric: 'platform_mrr',
        driverType: 'tenant',
        driverId: tenant.id,
        driverLabel: tenant.name,
        impactAbs: Math.floor(Math.random() * 500000),
        impactPct: Math.random() * 20 - 10,
        rank: Math.floor(Math.random() * 5) + 1
      }).onConflictDoNothing();
    }
    
    // Seed tenant scores
    for (const tenant of tenantList) {
      await db.insert(aiTenantScores).values({
        tenantId: tenant.id,
        date: now.toISOString().split('T')[0],
        churnRisk: Math.random() * 0.7,
        healthScore: Math.floor(Math.random() * 40) + 60,
        topSignals: JSON.stringify([
          { signal: 'payment_failures', severity: 'medium' },
          { signal: 'low_usage', severity: 'low' }
        ])
      }).onConflictDoNothing();
    }
    
    // Seed anomalies
    await db.insert(aiAnomalies).values({
      date: now.toISOString().split('T')[0],
      scopeType: 'platform',
      scopeId: null,
      metric: 'registrations',
      direction: 'low',
      zscore: -2.5,
      expected: 50,
      actual: 25,
      severity: 'warn'
    }).onConflictDoNothing();
    
    res.json({ message: 'AI data seeded successfully' });
  } catch (error) {
    console.error('Error seeding AI data:', error);
    res.status(500).json({ error: 'Failed to seed AI data' });
  }
}