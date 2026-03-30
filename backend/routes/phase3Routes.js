const express = require('express');
const router = express.Router();

// Import Phase 3 Controllers
const AllocationController = require('../controllers/phase3/AllocationController');
const FairnessAnalyticsController = require('../controllers/phase3/FairnessAnalyticsController');
const AuditController = require('../controllers/phase3/AuditController');
const ExportsController = require('../controllers/phase3/ExportsController');
const SimulationController = require('../controllers/phase3/SimulationController');
const SwapRecommendationsController = require('../controllers/phase3/SwapRecommendationsController');
const EmergencyHandlerController = require('../controllers/phase3/EmergencyHandlerController');
const PolicyEditorController = require('../controllers/phase3/PolicyEditorController');
const TeacherExplanationController = require('../controllers/phase3/TeacherExplanationController');

/**
 * Phase 3 Routes - All allocation management endpoints
 * Base path: /api/phase3
 */

// ============================================================
// ALLOCATION ROUTES
// ============================================================

router.get('/allocations', AllocationController.getAllocations);
router.post('/allocations', AllocationController.createAllocation);
router.get('/allocations/:allocation_id', AllocationController.getAllocationById);
router.put('/allocations/:allocation_id', AllocationController.updateAllocation);
router.post('/allocations/:allocation_id/approve', AllocationController.approveAllocation);
router.post('/allocations/:allocation_id/reject', AllocationController.rejectAllocation);
router.post('/allocations/:allocation_id/finalize', AllocationController.finalizeAllocation);
router.delete('/allocations/:allocation_id', AllocationController.deleteAllocation);
router.post('/allocations/:allocation_id/validate', AllocationController.validateAllocation);

// ============================================================
// FAIRNESS ANALYTICS ROUTES
// ============================================================

router.get('/allocations/:allocation_id/fairness', FairnessAnalyticsController.getFairnessMetrics);
router.post('/allocations/:allocation_id/fairness/analyze', FairnessAnalyticsController.analyzeFairness);
router.get('/allocations/:allocation_id/fairness/concerns', FairnessAnalyticsController.getFairnessConcerns);
router.get('/allocations/:allocation_id/fairness/report', FairnessAnalyticsController.generateFairnessReport);
router.post('/fairness/compare', FairnessAnalyticsController.compareFairness);

// ============================================================
// AUDIT ROUTES
// ============================================================

router.get('/audit/logs', AuditController.getAuditLogs);
router.get('/audit/allocation/:allocation_id', AuditController.getAllocationAuditTrail);
router.get('/audit/user/:user_id', AuditController.getUserAuditTrail);
router.get('/audit/compliance', AuditController.getComplianceReport);
router.get('/audit/export', AuditController.exportAuditLogs);

// ============================================================
// EXPORT ROUTES
// ============================================================

router.post('/exports/excel', ExportsController.exportToExcel);
router.post('/exports/pdf', ExportsController.exportToPDF);
router.post('/exports/ics', ExportsController.exportToICS);
router.get('/exports', ExportsController.listExports);
router.get('/exports/files/:filename', ExportsController.downloadFile);
router.delete('/exports/:export_id', ExportsController.deleteExport);
router.post('/exports/:export_id/resend', ExportsController.resendExport);

// ============================================================
// SIMULATION ROUTES
// ============================================================

router.post('/simulations', SimulationController.createSimulation);
router.get('/simulations/:allocation_id', SimulationController.getSimulations);
router.get('/simulations/detail/:simulation_id', SimulationController.getSimulationDetail);
router.post('/simulations/:simulation_id/approve', SimulationController.approveSimulation);
router.post('/simulations/:simulation_id/implement', SimulationController.implementSimulation);
router.delete('/simulations/:simulation_id', SimulationController.cancelSimulation);

// ============================================================
// SWAP RECOMMENDATIONS ROUTES
// ============================================================

router.post('/swaps/recommendations', SwapRecommendationsController.getSwapRecommendations);
router.post('/swaps', SwapRecommendationsController.createSwap);
router.get('/swaps/:allocation_id', SwapRecommendationsController.getPendingSwaps);
router.get('/swaps/detail/:swap_id', SwapRecommendationsController.getSwapDetail);
router.post('/swaps/:swap_id/approve', SwapRecommendationsController.approveSwap);
router.post('/swaps/:swap_id/reject', SwapRecommendationsController.rejectSwap);
router.post('/swaps/:swap_id/execute', SwapRecommendationsController.executeSwap);
router.post('/swaps/:swap_id/reverse', SwapRecommendationsController.reverseSwap);

// ============================================================
// EMERGENCY HANDLER ROUTES
// ============================================================

router.post('/emergencies', EmergencyHandlerController.reportEmergency);
router.get('/emergencies/:allocation_id', EmergencyHandlerController.getEmergencies);
router.get('/emergencies/detail/:incident_id', EmergencyHandlerController.getEmergencyDetail);
router.post('/emergencies/:incident_id/solutions', EmergencyHandlerController.getEmergencySolutions);
router.post('/emergencies/:incident_id/respond', EmergencyHandlerController.respondToEmergency);
router.post('/emergencies/:incident_id/rollback', EmergencyHandlerController.rollbackEmergency);

// ============================================================
// POLICY EDITOR ROUTES
// ============================================================

router.get('/policies', PolicyEditorController.listPolicies);
router.post('/policies', PolicyEditorController.createPolicy);
router.get('/policies/:policy_id', PolicyEditorController.getPolicyById);
router.put('/policies/:policy_id', PolicyEditorController.updatePolicy);
router.delete('/policies/:policy_id', PolicyEditorController.deletePolicy);
router.post('/policies/:policy_id/toggle', PolicyEditorController.togglePolicy);
router.post('/policies/:policy_id/validate', PolicyEditorController.validatePolicy);
router.post('/policies/:policy_id/test', PolicyEditorController.testPolicy);

// ============================================================
// TEACHER EXPLANATION ROUTES
// ============================================================

router.post('/explanations', TeacherExplanationController.requestExplanation);
router.get('/explanations/:allocation_id', TeacherExplanationController.getAllocationExplanations);
router.get('/explanations/request/:request_id', TeacherExplanationController.getExplanationDetail);
router.post('/explanations/:request_id/feedback', TeacherExplanationController.submitExplanationFeedback);
router.post('/explanations/:request_id/followup', TeacherExplanationController.askFollowUpQuestion);
router.get('/explanations/template/:question_type', TeacherExplanationController.getExplanationTemplate);

module.exports = router;
