import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { AlertCircle, GraduationCap, Star } from 'lucide-react';

interface AssessmentsViewProps {
  assessments: any[];
  submissions: any[];
  userLevel: number;
  onAssessmentComplete: () => void;
  userId: string;
}

export function AssessmentsView({ assessments, submissions, userLevel, onAssessmentComplete, userId }: AssessmentsViewProps) {
  // Load tutor-assigned grades
  const tutorGrades = (() => {
    const gradesData = localStorage.getItem(`grades_${userId}`);
    return gradesData ? JSON.parse(gradesData) : [];
  })();

  // Calculate statistics for tutor grades
  const currentLevelGrades = tutorGrades.filter((g: any) => g.level === userLevel);
  const averageGrade = currentLevelGrades.length > 0
    ? currentLevelGrades.reduce((sum: number, g: any) => sum + g.grade, 0) / currentLevelGrades.length
    : 0;
  const passRate = currentLevelGrades.length > 0
    ? (currentLevelGrades.filter((g: any) => g.grade >= 60).length / currentLevelGrades.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Tutor-Assigned Grades Section */}
      <div>
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          Your Grades - Level {userLevel}
        </h3>
        
        {currentLevelGrades.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No grades assigned yet</p>
              <p className="text-sm mt-2">Your tutor will grade your work throughout the semester</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Statistics Summary */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {averageGrade.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Average Grade</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600">
                      {passRate.toFixed(0)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Pass Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">
                      {currentLevelGrades.length}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Total Grades</p>
                  </div>
                </div>
                
                {averageGrade >= 60 ? (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      Great work! You're on track for level progression. Keep it up!
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Keep working hard! You need an average of 60% or higher for level progression.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grades List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Grades</CardTitle>
                <CardDescription>
                  Grades assigned by your tutor for Level {userLevel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentLevelGrades.sort((a: any, b: any) => 
                    new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
                  ).map((grade: any) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium capitalize">{grade.assessmentType}</p>
                          <Badge variant="outline" className="text-xs">
                            Level {grade.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Graded on {new Date(grade.gradedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            grade.grade >= 80 ? 'text-green-600' :
                            grade.grade >= 60 ? 'text-blue-600' :
                            grade.grade >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {grade.grade}%
                          </div>
                          <Progress 
                            value={grade.grade} 
                            className="h-1.5 w-20 mt-1"
                          />
                        </div>
                        <Badge 
                          variant={grade.grade >= 60 ? 'default' : 'destructive'}
                          className={grade.grade >= 60 ? 'bg-green-500' : ''}
                        >
                          {grade.grade >= 60 ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Info Note */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Your tutor will review your overall semester performance 
                    (grades, attendance, participation) at the end of the semester to verify if you 
                    can progress to the next level.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}