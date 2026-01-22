"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export default function CreateDivvyPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Novo grupo" }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || "Falha ao criar o grupo.");
      }

      // Depois de criar, volta pra lista (ou abre o grupo se você tiver rota)
      router.push("/dashboard/divvies");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Criar Divvy</h1>
      <p className="text-gray-600">
        Este fluxo cria o grupo via <code className="font-mono">POST /api/groups</code> para garantir membership.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nome do grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Viagem 2026"
        />

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} variant="primary">
            Criar
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => router.push("/dashboard/divvies")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}
