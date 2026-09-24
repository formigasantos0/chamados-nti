from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.unidades import router as unidades_router
from app.api.routes.usuarios import router as usuarios_router
from app.api.routes.chamados import router as chamados_router
from app.api.routes.anexos import router as anexos_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Chamados NTI API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(unidades_router)
app.include_router(usuarios_router)
app.include_router(chamados_router)
app.include_router(anexos_router)

@app.get("/")
def root():
    return {
        "application": "Chamados NTI",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }