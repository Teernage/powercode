export type AgentMode = "code" | "plan";

export type AgentStatus =
  | "idle" // 空闲状态
  | "planning" // 规划阶段
  | "waiting_for_approval" // 等待批准阶段
  | "executing"; // 执行阶段

export interface PlanDraft {
  title: string; // 计划标题
  content: string; // 计划内容
  steps: string[]; // 计划步骤
}
/**
 * Agent 状态机
 */
export class AgentState {
  private mode: AgentMode; // 当前模式
  private status: AgentStatus; // 当前状态
  private pendingPlan?: PlanDraft; // 待批准计划草稿
  private approvedPlan?: PlanDraft; // 已批准计划草稿

  constructor(initialMode: AgentMode = "code") {
    this.mode = initialMode; // 初始模式
    this.status = initialMode === "plan" ? "planning" : "idle"; // 初始状态
  }
  /**
   * 获取当前模式
   */
  getMode(): AgentMode {
    return this.mode;
  }
  /**
   * 获取当前状态
   */
  getStatus(): AgentStatus {
    return this.status;
  }
  /**
   * 获取待批准计划草稿
   */
  getPendingPlan(): PlanDraft | undefined {
    return this.pendingPlan;
  }
  /**
   * 获取已批准计划草稿
   */
  getApprovedPlan(): PlanDraft | undefined {
    return this.approvedPlan;
  }
  /**
   * 进入规划阶段
   */
  enterPlan(): void {
    this.mode = "plan";
    this.status = "planning";
    this.pendingPlan = undefined;
    this.approvedPlan = undefined;
  }
  /**
   * 进入执行阶段
   */
  enterCode(): void {
    this.mode = "code";
    this.status = "idle";
    this.pendingPlan = undefined;
    this.approvedPlan = undefined;
  }
  /**
   * 提交计划
   */
  submitPlan(plan: PlanDraft): void {
    if (
      this.mode !== "plan" ||
      this.status !== "planning"
    ) {
      throw new Error("只有规划阶段可以提交计划。");
    }

    this.pendingPlan = plan;
    this.status = "waiting_for_approval";
  }
  /**
   * 修改计划
   */
  refinePlan(): void {
    if (
      this.status !== "waiting_for_approval" ||
      !this.pendingPlan
    ) {
      throw new Error("当前没有等待修改的计划。");
    }

    this.status = "planning";
  }
  /**
   * 批准计划
   */
  approvePlan(): PlanDraft {
    if (
      this.status !== "waiting_for_approval" ||
      !this.pendingPlan
    ) {
      throw new Error("当前没有等待批准的计划。");
    }

    const plan = this.pendingPlan;

    this.mode = "code";
    this.status = "executing";
    this.pendingPlan = undefined;
    this.approvedPlan = plan;

    return plan;
  }
  /**
   * 取消计划
   */
  cancelPlan(): void {
    this.mode = "code";
    this.status = "idle";
    this.pendingPlan = undefined;
    this.approvedPlan = undefined;
  }
  /**
   * 完成执行
   */
  finishExecution(): void {
    if (this.status === "executing") {
      this.status = "idle";
      this.approvedPlan = undefined;
    }
  }
}
/**
 * 格式化计划
 */
export function formatPlan(plan: PlanDraft): string {
  return `# ${plan.title}

${plan.content.trim()}
`;
}