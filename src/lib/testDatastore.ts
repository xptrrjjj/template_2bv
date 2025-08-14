import { apiClient } from "@/services/api";

export const testDatastoreOperations = async () => {
  const testResults: Array<{ operation: string; status: string; data: unknown; error?: string }> =
    [];
  const identifier = process.env.NEXT_PUBLIC_APP_IDENTIFIER || "antd_recruiter";
  const testRecordId = `test_${Date.now()}`;

  try {
    // Test 1: Create a new record
    const createResult = await apiClient.createRecord(identifier, {
      app_id: identifier,
      record_id: testRecordId,
      name: "Test Candidate",
      email: "test@example.com",
      position: "Software Developer",
      status: "active",
      created_at: new Date().toISOString(),
    });

    testResults.push({
      operation: "Create Record",
      status: createResult.status,
      data: createResult,
    });

    // Test 2: Retrieve records
    const retrieveResult = await apiClient.getRecords(identifier);

    testResults.push({
      operation: "Retrieve Records",
      status: retrieveResult.status,
      data: retrieveResult,
    });

    // Test 3: Update the record
    const updateResult = await apiClient.updateRecord(identifier, {
      record_id: testRecordId,
      name: "Test Candidate Updated",
      last_updated: new Date().toISOString(),
    });

    testResults.push({
      operation: "Update Record",
      status: updateResult.status,
      data: updateResult,
    });

    // Test 4: Append to the record
    const appendResult = await apiClient.appendToRecord(identifier, {
      record_id: testRecordId,
      notes: "Added via append operation",
      skills: ["JavaScript", "TypeScript", "React"],
    });

    testResults.push({
      operation: "Append to Record",
      status: appendResult.status,
      data: appendResult,
    });

    // Test 5: Delete the test record
    const deleteResult = await apiClient.deleteRecord(identifier, testRecordId);

    testResults.push({
      operation: "Delete Record",
      status: deleteResult.status,
      data: deleteResult,
    });
  } catch (error) {
    testResults.push({
      operation: "Test Suite",
      status: "error",
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return testResults;
};
