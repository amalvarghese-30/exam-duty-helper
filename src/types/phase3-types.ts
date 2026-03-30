/**
 * Phase 3: Type Definitions for Intelligent Automation & Analytics
 */

// ============================================
// ALLOCATION SIMULATION TYPES
// ============================================

export interface AllocationSimulation {
    _id: string;
    institution_id: string;
    allocation_id: string;
    simulation_result: AllocationResult;
    comparison: AllocationComparison;
    fairness_metrics: FairnessMetrics;
    execution_time: number;
    created_by: string;
    created_at: Date;
    approved_at?: Date;
    is_applied: boolean;
    approval_reason?: string;
}

export interface AllocationResult {
    exam_id: string;
    teacher_id: string;
    subject: string;
    role: string;
    date: Date;
    time_slot: string;
    location?: string;
    marked_priority?: boolean;
}

export interface AllocationComparison {
    added: AllocationChange[];
    removed: AllocationChange[];
    unchanged: AllocationResult[];
    change_count: number;
    change_percentage: number;
}

export interface AllocationChange extends AllocationResult {
    reason: string;
    fairness_impact: number;
}

// ============================================
// FAIRNESS ANALYTICS TYPES
// ============================================

export interface FairnessAnalytics {
    allocation_id: string;
    fairness_score: number; // 0-100
    fairness_assessment: 'Good' | 'Fair' | 'Poor';
    workload_stats: WorkloadStats;
    department_stats: Record<string, DepartmentStats>;
    overloaded_teachers: TeacherLoad[];
    underloaded_teachers: TeacherLoad[];
    patterns: Pattern[];
    generated_at: Date;
}

export interface FairnessMetrics {
    mean_duties: number;
    std_dev: number;
    variance: number;
    min_duties: number;
    max_duties: number;
    fairness_index: number; // 0-100
    gini_coefficient?: number; // Economic inequality measure
}

export interface WorkloadStats {
    mean: number;
    std_dev: number;
    variance: number;
    min: number;
    max: number;
    median: number;
    q1: number; // 25th percentile
    q3: number; // 75th percentile
    distribution: WorkloadBucket[]; // For histogram
}

export interface WorkloadBucket {
    range: string; // "2-3", "3-4", etc
    count: number;
    percentage: number;
}

export interface DepartmentStats {
    department_id: string;
    department_name: string;
    total_duties: number;
    avg_duties_per_teacher: number;
    total_teachers: number;
    teachers_available: number;
    workload_variance: number;
    fairness_score: number;
    overload_risk: 'low' | 'medium' | 'high';
}

export interface TeacherLoad {
    id: string;
    name: string;
    duties_assigned: number;
    mean_duties: number;
    std_dev: number;
    percentile: number; // 0-100
    threshold: number;
    excess_or_deficit: number;
    reliability_score?: number;
    subjects: string[];
}

export interface Pattern {
    pattern: string; // Description of detected pattern
    impact: 'low' | 'medium' | 'high';
    affected_teachers: number;
    recommendation: string;
}

// ============================================
// SWAP RECOMMENDATION TYPES
// ============================================

export interface SwapRecommendation {
    id: string;
    allocation_id: string;
    overloaded: TeacherInfo;
    underloaded: TeacherInfo;
    swappable_duties: SwappableDuty[];
    improvement_percent: number;
    priority: number; // Calculated based on improvement
    confidence: number; // 0-100
    reason: string;
}

export interface TeacherInfo {
    id: string;
    name: string;
    department: string;
    duties: number;
    reliability: number;
    available: boolean;
}

export interface SwappableDuty {
    exam_id: string;
    subject: string;
    date: Date;
    time_slot: string;
    difficulty_rating: number;
    current_teacher_reliability: number;
    replacement_teacher_reliability: number;
    swap_score: number;
}

export interface SwapResult {
    swap_id: string;
    status: 'applied' | 'failed' | 'pending_approval';
    old_allocation: AllocationResult[];
    new_allocation: AllocationResult[];
    fairness_improvement: number;
    message: string;
}

// ============================================
// POLICY TYPES
// ============================================

export interface DepartmentPolicy {
    _id: string;
    department_id: string;
    institution_id: string;
    max_daily_duties: number;
    max_weekly_duties: number;
    min_gap_hours: number;
    eligible_roles: string[];
    cross_department_eligible: boolean;
    priority_subjects: string[];
    seniority_multiplier: number;
    subject_weights: Record<string, number>; // Math: 1.2, Science: 1.0
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    updated_by: string;
}

export interface PolicyTemplate {
    name: string; // CBSE, Autonomous, University, etc.
    description: string;
    default_config: Partial<DepartmentPolicy>;
    category: 'public' | 'private';
}

export interface PolicyValidationResult {
    is_valid: boolean;
    violations: PolicyViolation[];
    warnings: PolicyWarning[];
    conflict_pairs: PolicyConflict[];
}

export interface PolicyViolation {
    type: string;
    policy_field: string;
    value: any;
    message: string;
    severity: 'error' | 'warning';
}

export interface PolicyWarning {
    message: string;
    affected_exams: number;
    recommendation: string;
}

export interface PolicyConflict {
    policy1: string;
    policy2: string;
    conflict_description: string;
    resolution_suggestion: string;
}

// ============================================
// EMERGENCY HANDLING TYPES
// ============================================

export interface EmergencyRequest {
    teacher_id: string;
    exam_ids: string[]; // Exams they can't teach
    reason: 'illness' | 'leave' | 'conflict' | 'emergency' | 'other';
    availability_until: Date;
    notes?: string;
}

export interface EmergencyResponse {
    request_id: string;
    status: 'processing' | 'completed' | 'failed';
    affected_exams: AffectedExam[];
    replacements_found: boolean;
    execution_time: number;
    message: string;
}

export interface AffectedExam {
    exam_id: string;
    subject: string;
    date: Date;
    time_slot: string;
    original_teacher: string;
    replacement_candidates: ReplacementCandidate[];
}

export interface ReplacementCandidate {
    teacher_id: string;
    name: string;
    reliability: number;
    availability: boolean;
    subject_expertise: number; // 0-1
    workload_impact: number;
    ranking_score: number;
}

// ============================================
// TEACHER EXPLANATION TYPES
// ============================================

export interface TeacherExplanation {
    teacher_id: string;
    allocation_id: string;
    duties_assigned: number;
    explanation_text: string;
    fairness_context: FairnessContext;
    allocation_factors: AllocationFactor[];
    similar_teachers: SimilarTeacher[];
    appeal_allowed: boolean;
    generated_at: Date;
}

export interface FairnessContext {
    teacher_duties: number;
    institution_average_duties: number;
    teacher_percentile: number; // 0-100
    department_average_duties: number;
    department_percentile: number;
    above_or_below_average: string;
}

export interface AllocationFactor {
    factor: string; // 'availability', 'reliability', 'subject_expertise', 'fairness', 'seniority'
    weight: number; // 0-1
    contribution: 'positive' | 'neutral' | 'negative';
    score: number; // 0-100
    explanation: string;
}

export interface SimilarTeacher {
    teacher_id: string;
    name: string;
    duties: number;
    difference_percent: number;
    reason_for_difference: string;
}

// ============================================
// EXPORT TYPES
// ============================================

export interface ExportRequest {
    allocation_id: string;
    export_type: ExportType;
    format: ExportFormat;
    filters?: ExportFilters;
    include_metrics: boolean;
    include_explanations: boolean;
}

export type ExportType =
    | 'department_chart'
    | 'teacher_duty_list'
    | 'room_allocation'
    | 'daily_schedule'
    | 'fairness_report'
    | 'supervisor_report';

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'ics';

export interface ExportFilters {
    department_ids?: string[];
    teacher_ids?: string[];
    exam_ids?: string[];
    date_from?: Date;
    date_to?: Date;
    roles?: string[];
}

export interface ExportResult {
    export_id: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    download_url?: string;
    file_name: string;
    size_kb?: number;
    generated_at?: Date;
    expires_at?: Date;
    error_message?: string;
}

// ============================================
// ALLOCATION HISTORY TYPES
// ============================================

export interface AllocationHistory {
    _id: string;
    allocation_id: string;
    change_type: 'created' | 'modified' | 'approved' | 'published' | 'rolled_back' | 'swapped';
    changed_by: string; // User ID
    previous_state?: any;
    new_state?: any;
    reason: string;
    fairness_impact?: number;
    timestamp: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
    execution_time_ms?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// ============================================
// DASHBOARD STATE TYPES
// ============================================

export interface DashboardState {
    loading: boolean;
    error?: string;
    currentAllocation: any;
    metrics: FairnessAnalytics | null;
    simulations: AllocationSimulation[];
    swapRecommendations: SwapRecommendation[];
    policies: DepartmentPolicy[];
    selectedTab: string;
    lastUpdated: Date;
}

export interface DashboardFilters {
    department_id?: string;
    teacher_id?: string;
    role?: string;
    date_range?: [Date, Date];
    search?: string;
}
