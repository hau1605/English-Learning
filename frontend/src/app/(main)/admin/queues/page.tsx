"use client";

import { useState } from "react";
import { useQueueJob } from "@/features/admin/hooks/use-queue.hook";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function QueueJobPage() {
  const [jobId, setJobId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const { data, isLoading, error, refetch } = useQueueJob(jobId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error("Please enter a job ID");
      return;
    }
    setJobId(inputValue.trim());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      case "PROCESSING":
        return "text-blue-600 bg-blue-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "CANCELLED":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "FAILED":
        return <AlertCircle className="w-5 h-5" />;
      case "PROCESSING":
        return <Loader className="w-5 h-5 animate-spin" />;
      case "PENDING":
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Queue Job Monitor
          </h1>
          <p className="text-gray-500 mt-1">
            Track and monitor background job status
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Job ID..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search"}
          </Button>
          {jobId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </form>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Job</h3>
              <p className="text-sm text-red-700 mt-1">
                {error instanceof Error
                  ? error.message
                  : "Failed to load job details"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Job Details */}
      {data && data.data && (
        <div className="space-y-4">
          {/* Status Header */}
          <Card className={`p-6 ${getStatusColor(data.data.status)} border`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(data.data.status)}
                <div>
                  <p className="font-semibold">Job Status</p>
                  <p className="text-sm opacity-75">{data.data.name}</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{data.data.status}</span>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Job ID
                </p>
                <p className="font-mono text-sm break-all">{data.data.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Attempts
                </p>
                <p className="font-mono text-sm">
                  {data.data.attempts} / {data.data.maxAttempts}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Created At
                </p>
                <p className="font-mono text-sm">
                  {new Date(data.data.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Updated At
                </p>
                <p className="font-mono text-sm">
                  {new Date(data.data.updatedAt).toLocaleString()}
                </p>
              </div>
              {data.data.processedAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Processed At
                  </p>
                  <p className="font-mono text-sm">
                    {new Date(data.data.processedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {data.data.scheduledAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Scheduled At
                  </p>
                  <p className="font-mono text-sm">
                    {new Date(data.data.scheduledAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Job Data */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Job Data</h3>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-64 border">
              {JSON.stringify(data.data.data, null, 2)}
            </pre>
          </Card>

          {/* Result (if completed) */}
          {data.data.result && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="font-semibold mb-4 text-green-900">Result</h3>
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-64 border border-green-200">
                {JSON.stringify(data.data.result, null, 2)}
              </pre>
            </Card>
          )}

          {/* Error (if failed) */}
          {data.data.error && (
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="font-semibold mb-4 text-red-900">Error Details</h3>
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-64 border border-red-200 text-red-700">
                {data.data.error}
              </pre>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!jobId && !isLoading && (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No Job Selected
          </h3>
          <p className="text-gray-500 mt-2">
            Enter a job ID to view its status and details
          </p>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            Loading Job Details...
          </h3>
        </Card>
      )}
    </div>
  );
}
