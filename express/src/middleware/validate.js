const { z } = require('zod');

const outboxItemSchema = z.object({
  outboxId: z.string().uuid(),
  entityId: z.string().uuid(),
  type:     z.enum(['UPSERT', 'DELETE']),
  payload:  z.object({
    id:        z.string().uuid().optional(),
    name:      z.string().min(1).max(255).optional(),
    createdAt: z.number().int().optional(),
    updatedAt: z.number().int(),
  }).optional(),
});

const pushSchema = z.object({
  items: z.array(outboxItemSchema).min(1).max(50),
});

const userCreateSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1).max(255),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

const userUpdateSchema = z.object({
  name:      z.string().min(1).max(255).optional(),
  updatedAt: z.number().int(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validate, pushSchema, userCreateSchema, userUpdateSchema };
