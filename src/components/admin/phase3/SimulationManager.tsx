import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import SimulationService from '@/services/phase3/SimulationService';
import { AlertCircle, Play, CheckCircle, Clock, Trash2 } from 'lucide-react';
import SimulationRiskPanel from "./SimulationRiskPanel";

interface SimulationManagerProps {
    allocationId: string;
}

interface Simulation {
    _id: string;
    simulation_name: string;
    config: {
        scenario: string;
    };
    results: {
        metrics?: {
            average_fairness_score: number;
            constraint_violations_total: number;
        };
    };
    approval?: {
        status: string;
    };
    createdAt: string;
    risk_prediction?: any;
}

export const SimulationManager: React.FC<SimulationManagerProps> = ({ allocationId }) => {
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [simulationResult, setSimulationResult] = useState<any>(null);

    useEffect(() => {
        loadSimulations();
    }, [allocationId]);

    const loadSimulations = async () => {
        setLoading(true);
        const result = await SimulationService.getSimulations(allocationId);
        if (result.success) {
            setSimulations(result.data?.simulations || []);
            setError(null);
        } else {
            setError(result.error || 'Failed to load simulations');
        }
        setLoading(false);
    };

    const handleRunSimulation = async (scenario: string) => {
        setRunning(`running-${Date.now()}`);
        const result = await SimulationService.createSimulation(allocationId, {
            scenario: scenario as any,
            parameters: {
                fairness_weight: 0.4,
                constraint_weight: 0.3,
                load_balance_weight: 0.2,
                availability_weight: 0.1
            }
        });

        if (result.success) {
            setSimulationResult(result.data);
            await loadSimulations();
            setError(null);
        } else {
            setError(result.error || 'Failed to run simulation');
        }
        setRunning(null);
    };

    const getScenarioIcon = (scenario: string) => {
        switch (scenario) {
            case 'baseline':
                return '📊';
            case 'what_if':
                return '🤔';
            case 'optimization':
                return '⚡';
            case 'fairness_improvement':
                return '⚖️';
            default:
                return '🔄';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Simulation Manager</h3>
                <Button onClick={loadSimulations} disabled={loading} size="sm">
                    {loading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Risk Prediction Panel */}
            {simulationResult?.risk_prediction && (
                <SimulationRiskPanel riskPrediction={simulationResult.risk_prediction} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Run New Simulation</CardTitle>
                    <CardDescription>Explore different allocation scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['baseline', 'what_if', 'optimization', 'fairness_improvement', 'stress_test'].map(
                            (scenario) => (
                                <Button
                                    key={scenario}
                                    aria-pressed={running === scenario}
                                    variant={running === scenario ? 'default' : 'outline'}
                                    disabled={running !== null}
                                    onClick={() => handleRunSimulation(scenario)}
                                    className="flex items-center gap-2"
                                >
                                    {running === scenario && <Clock className="w-4 h-4 animate-spin" />}
                                    {!running && <Play className="w-4 h-4" />}
                                    {getScenarioIcon(scenario)} {scenario.replace('_', ' ')}
                                </Button>
                            )
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {simulations.map((sim) => (
                    <Card key={sim._id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{sim.simulation_name || `Simulation ${sim._id.substring(0, 8)}`}</CardTitle>
                                    <CardDescription className="text-sm">
                                        Scenario: {sim.config.scenario} • Created {new Date(sim.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                {sim.approval?.status && (
                                    <Badge className={`${getStatusColor(sim.approval.status)} text-white`}>
                                        {sim.approval.status}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            {sim.results?.metrics && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Fairness Score</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {(sim.results.metrics.average_fairness_score * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Constraints</p>
                                        <p className="text-xl font-bold">
                                            {sim.results.metrics.constraint_violations_total === 0 ? (
                                                <span className="text-green-600">✓ Valid</span>
                                            ) : (
                                                <span className="text-red-600">{sim.results.metrics.constraint_violations_total}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    View Results
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {simulations.length === 0 && !loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <p className="text-gray-500">No simulations yet. Run one to explore scenarios.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SimulationManager;