"use client";

import React from "react";
import { OperationForm } from "./OperationForm";
import { useDatastoreOperations, TestResult, DatastoreAction } from "./useDatastoreOperations";

interface DatastoreOperationFormProps {
  onResult: (result: TestResult) => void;
}

export const DatastoreOperationFormRefactored: React.FC<DatastoreOperationFormProps> = ({ onResult }) => {
  const {
    operationForm,
    operationLoading,
    handleOperationSubmit,
    loadOperationTemplate,
    clearOperationForm,
  } = useDatastoreOperations();

  const handleSubmit = async (values: any) => {
    const result = await handleOperationSubmit(values);
    onResult(result);
  };

  const handleLoadTemplate = (action: string) => {
    loadOperationTemplate(action as DatastoreAction);
  };

  return (
    <OperationForm
      form={operationForm}
      onSubmit={handleSubmit}
      loading={operationLoading}
      onClear={clearOperationForm}
      onLoadTemplate={handleLoadTemplate}
    />
  );
};