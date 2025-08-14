import React from 'react';
import { UserReportsDebugger } from '../components/debug/UserReportsDebugger';

export default function DebugUserReports() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Reports Debug</h1>
        <UserReportsDebugger />
      </div>
    </div>
  );
}
