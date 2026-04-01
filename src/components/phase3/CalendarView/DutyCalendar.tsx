import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock } from 'lucide-react';

interface Duty {
    exam_id: string;
    subject: string;
    teacher_id: string;
    teacher_name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number: string;
    role: string;
    department: string;
}

interface DutyCalendarProps {
    duties: Duty[];
    institution?: any;
    currentMonth?: Date;
}

export const DutyCalendar: React.FC<DutyCalendarProps> = ({
    duties = [],
    institution,
    currentMonth: initialMonth,
}) => {
    const [currentDate, setCurrentDate] = useState<Date>(initialMonth || new Date(2026, 3, 1));
    const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');

    // Extract unique teachers and departments
    const teachersList = useMemo(() => {
        const unique = new Map();
        duties.forEach((duty) => {
            if (!unique.has(duty.teacher_id)) {
                unique.set(duty.teacher_id, duty.teacher_name);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [duties]);

    const departments = useMemo(() => {
        const unique = new Set(duties.map((d) => d.department).filter(Boolean));
        return Array.from(unique).sort();
    }, [duties]);

    // Filter duties
    const filteredDuties = useMemo(() => {
        return duties.filter((duty) => {
            if (selectedTeacher !== 'all' && duty.teacher_id !== selectedTeacher) return false;
            if (selectedDept !== 'all' && duty.department !== selectedDept) return false;
            return true;
        });
    }, [duties, selectedTeacher, selectedDept]);

    // Get duties for current month
    const monthDuties = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return filteredDuties.filter((duty) => {
            const dutyDate = new Date(duty.exam_date);
            return dutyDate.getFullYear() === year && dutyDate.getMonth() === month;
        });
    }, [filteredDuties, currentDate]);

    // Get duties by date
    const dutiesByDate = useMemo(() => {
        const map = new Map<string, Duty[]>();
        monthDuties.forEach((duty) => {
            const date = duty.exam_date;
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date)!.push(duty);
        });
        return map;
    }, [monthDuties]);

    // Generate calendar days
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle>Duty Calendar View</CardTitle>
                    <CardDescription>
                        Visual timeline of exam duties across the month
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Teacher
                            </label>
                            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachersList.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Department
                            </label>
                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                                {monthDuties.length} duties showing
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{monthName}</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 bg-gray-100 border-b">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div
                                    key={day}
                                    className="text-center py-2 font-semibold text-sm text-gray-700"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const dateStr =
                                    day && day >= 1 && day <= 9
                                        ? `2026-0${currentDate.getMonth() + 1}-0${day}`
                                        : day && day >= 10 && day <= 31
                                            ? `2026-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${day}`
                                            : null;

                                const dayDuties = dateStr ? dutiesByDate.get(dateStr) || [] : [];

                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[120px] border-r border-b p-2 ${!day ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        {day && (
                                            <>
                                                <div className="font-semibold text-sm mb-2">
                                                    {day}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayDuties.slice(0, 2).map((duty, i) => (
                                                        <div
                                                            key={i}
                                                            className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs truncate"
                                                            title={`${duty.subject} - ${duty.teacher_name} (${duty.role})`}
                                                        >
                                                            <div className="font-semibold truncate">
                                                                {duty.subject}
                                                            </div>
                                                            <div className="text-blue-700 truncate">
                                                                {duty.start_time}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dayDuties.length > 2 && (
                                                        <div className="text-xs text-gray-500 pl-1">
                                                            +{dayDuties.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>{monthDuties.length} total duties this month</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <span>{new Set(monthDuties.map((d) => d.teacher_id)).size} teachers</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>{new Set(monthDuties.map((d) => d.exam_date)).size} exam dates</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
