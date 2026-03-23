function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  console.error(isProd ? err.message : err);

  const sqliteErrors = {
    SQLITE_CONSTRAINT_UNIQUE:  { status: 409, message: 'Registro já existe.' },
    SQLITE_CONSTRAINT_NOTNULL: { status: 400, message: 'Campo obrigatório ausente.' },
    SQLITE_CONSTRAINT_CHECK:   { status: 400, message: 'Valor inválido para o campo.' },
  };

  const sqliteMatch = sqliteErrors[err.code];
  if (sqliteMatch) {
    return res.status(sqliteMatch.status).json({ error: sqliteMatch.message });
  }

  res.status(err.status || 500).json({
    error: isProd ? 'Erro interno do servidor.' : err.message,
  });
}

module.exports = { errorHandler };
