"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDatastoreOperations, TestResult } from "./useDatastoreOperations";
import { TemplateSelector } from "./TemplateSelector";

interface DatastoreRetrieveFormProps {
  onResult: (result: TestResult) => void;
}

export const DatastoreRetrieveForm: React.FC<DatastoreRetrieveFormProps> = ({ onResult }) => {
  const {
    retrieveForm,
    retrieveLoading,
    handleRetrieveSubmit,
    loadRetrieveTemplate,
    clearRetrieveForm,
  } = useDatastoreOperations();

  const handleSubmit = async (values: any) => {
    const result = await handleRetrieveSubmit(values);
    onResult(result);
  };

  const handleLoadTemplate = (templateKey: string) => {
    loadRetrieveTemplate(templateKey as keyof typeof import("./useDatastoreOperations").retrieveTemplates);
  };

  return (
    <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-[#667eea]" />
          <span className="text-base font-semibold text-slate-800">
            Datastore Retrieve
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
      <Form {...retrieveForm}>
        <form onSubmit={retrieveForm.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={retrieveForm.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-slate-800">Identifier</FormLabel>
              <FormControl>
                <Input placeholder="e.g., recruitment_tool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={retrieveForm.control}
          name="filters"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-slate-800">Filters (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  placeholder='Enter JSON filters... e.g., { "status": "active" }'
                  className="font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Leave empty {"{}"} to retrieve all records
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 w-full">
          <TemplateSelector
            type="retrieve"
            onLoadTemplate={handleLoadTemplate}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={clearRetrieveForm} className="gap-1">
              <X className="w-4 h-4" />
              Clear
            </Button>
            <Button
              type="submit"
              disabled={retrieveLoading}
              className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none gap-1"
            >
              <Search className="w-4 h-4" />
              {retrieveLoading ? "Retrieving..." : "Retrieve"}
            </Button>
          </div>
        </div>
        </form>
      </Form>
      </CardContent>
    </Card>
  );
};
