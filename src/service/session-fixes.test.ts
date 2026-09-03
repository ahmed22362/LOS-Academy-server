/// <reference path="../../types/express.d.ts" />

import assert from "node:assert/strict";
import { updateModelService } from "./factory.services";
import { updateSessionForAdminSchema } from "../schema/session.schema";
import User from "../db/models/user.model";
import { updateUserRemainSessionService } from "./user.service";

async function test() {
  let updateCalled = false;
  const model: any = {
    getAttributes: () => ({ count: { type: { key: "INTEGER" } } }),
    update: async () => {
      updateCalled = true;
      return [1, []];
    },
  };

  await assert.rejects(
    updateModelService({
      ModelClass: model as any,
      id: 1,
      updatedData: { count: 9.5 },
    }),
    /count must be an integer/,
  );
  assert.equal(updateCalled, false);
  model.getAttributes = () => ({ age: { type: { key: "FLOAT" } } });
  await updateModelService({
    ModelClass: model as any,
    id: 1,
    updatedData: { age: 9.5 },
  });
  assert.equal(updateCalled, true);
  assert.equal(
    updateSessionForAdminSchema.safeParse({
      body: { status: "both_absent", reschedule_request_count: 1 },
    }).success,
    true,
  );
  assert.equal(
    updateSessionForAdminSchema.safeParse({
      body: { reschedule_request_count: 9.5 },
    }).success,
    false,
  );

  const originalFindByPk = User.findByPk;
  const originalUpdate = User.update;
  let creditUpdateCalled = false;
  User.findByPk = (async () => ({ remainSessions: 0 })) as any;
  User.update = (async () => {
    creditUpdateCalled = true;
    return [1];
  }) as any;
  try {
    const result = await updateUserRemainSessionService({
      userId: "test-user",
      amountOfSessions: -1,
    });
    assert.equal(result, 0);
    assert.equal(creditUpdateCalled, false);
  } finally {
    User.findByPk = originalFindByPk;
    User.update = originalUpdate;
  }
}

test();
