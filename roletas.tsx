"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Play, RotateCcw, Volume2, VolumeX, Info } from "lucide-react"
import Image from "next/image"

export default function Component() {
  // Composição inicial das salas
  const composicaoInicial = {
    "Sala Azul": ["Tatiane", "Iago", "Dayana"],
    "Sala Roxa": ["Vitória", "Andrey", "Gabrielle", "Ana Julia", "Isabelly", "Luciene", "Júlia", "Vanda"],
    "Sala Vermelha": ["Taiane", "Karoline"],
  }

  const salas = ["Sala Vermelha", "Sala Roxa", "Sala Azul"]
  const limitesTrocas = {
    "Sala Azul": { saem: 2, entram: 2 },
    "Sala Roxa": { saem: 2, entram: 2 },
    "Sala Vermelha": { saem: 1, entram: 2 },
  }

  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string>("")
  const [salaSelecionada, setSalaSelecionada] = useState<string>("")
  const [girandoColaborador, setGirandoColaborador] = useState(false)
  const [girandoSala, setGirandoSala] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [somAtivado, setSomAtivado] = useState(true)
  const [mostrarRegras, setMostrarRegras] = useState(false)

  // Estado para controlar as trocas - separando saídas e entradas
  const [saidasRealizadas, setSaidasRealizadas] = useState<{ [key: string]: number }>({
    "Sala Azul": 0,
    "Sala Roxa": 0,
    "Sala Vermelha": 0,
  })

  const [entradasRealizadas, setEntradasRealizadas] = useState<{ [key: string]: number }>({
    "Sala Azul": 0,
    "Sala Roxa": 0,
    "Sala Vermelha": 0,
  })

  const [pessoasMovidas, setPessoasMovidas] = useState<{ [key: string]: string }>({}) // pessoa -> sala de destino
  const [historicoSorteios, setHistoricoSorteios] = useState<
    Array<{ colaborador: string; salaOriginal: string; salaDestino: string }>
  >([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const roletaColaboradorRef = useRef<HTMLDivElement>(null)
  const roletaSalaRef = useRef<HTMLDivElement>(null)

  // Função para encontrar a sala original de uma pessoa
  const encontrarSalaOriginal = (pessoa: string): string => {
    for (const [sala, pessoas] of Object.entries(composicaoInicial)) {
      if (pessoas.includes(pessoa)) {
        return sala
      }
    }
    return ""
  }

  // Função para obter colaboradores disponíveis para sorteio
  const obterColaboradoresDisponiveis = (): string[] => {
    const todasPessoas = Object.values(composicaoInicial).flat()
    return todasPessoas.filter((pessoa) => {
      // Se a pessoa já foi movida, não pode ser sorteada novamente
      if (pessoasMovidas[pessoa]) return false

      // Verifica se a sala de origem ainda pode ter saídas
      const salaOriginal = encontrarSalaOriginal(pessoa)
      const limiteSaidas = limitesTrocas[salaOriginal as keyof typeof limitesTrocas].saem
      const saidasJaRealizadas = saidasRealizadas[salaOriginal]

      return saidasJaRealizadas < limiteSaidas
    })
  }

  // Função para obter salas disponíveis para uma pessoa
  const obterSalasDisponiveis = (pessoa: string): string[] => {
    const salaOriginal = encontrarSalaOriginal(pessoa)
    const salasDisponiveis = salas.filter((sala) => {
      // Não pode ir para a sala onde já está
      if (sala === salaOriginal) return false

      // Verifica se a sala ainda tem vagas para entrada
      const limiteEntradas = limitesTrocas[sala as keyof typeof limitesTrocas].entram
      const entradasJaRealizadas = entradasRealizadas[sala]
      if (entradasJaRealizadas >= limiteEntradas) return false

      // Regra especial para Sala Vermelha: pode ter até 2 pessoas, mas de salas diferentes
      if (sala === "Sala Vermelha" && entradasJaRealizadas >= 1) {
        // Verifica se já tem alguém da mesma sala original na Sala Vermelha
        const jaTemAlguemDaMesmaSala = Object.entries(pessoasMovidas).some(([outraPessoa, salaDestino]) => {
          if (salaDestino === "Sala Vermelha") {
            const salaOriginalOutraPessoa = encontrarSalaOriginal(outraPessoa)
            return salaOriginalOutraPessoa === salaOriginal
          }
          return false
        })

        if (jaTemAlguemDaMesmaSala) return false
      }

      // Para Sala Azul e Sala Roxa: podem receber qualquer pessoa (respeitando apenas o limite de entradas)
      return true
    })

    return salasDisponiveis
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
      criarSomRoleta()
    }
  }, [])

  const criarSomRoleta = () => {
    if (typeof window !== "undefined" && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const criarBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          if (!somAtivado) return

          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = frequency
          oscillator.type = "sine"

          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
        }, delay)
      }

      for (let i = 0; i < 15; i++) {
        criarBeep(800 + i * 20, 0.1, i * 200)
      }
    }
  }

  const aplicarAnimacaoDesaceleracao = (elemento: HTMLDivElement | null, duracao: number) => {
    if (!elemento) return

    elemento.style.animation = "none"
    elemento.style.transform = "rotate(0deg)"
    elemento.offsetHeight

    elemento.style.transition = `transform ${duracao}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    elemento.style.transform = "rotate(720deg)"
  }

  const girarRoletaColaborador = () => {
    const colaboradoresDisponiveis = obterColaboradoresDisponiveis()

    if (colaboradoresDisponiveis.length === 0) {
      alert("Não há mais colaboradores disponíveis para sorteio!")
      return
    }

    setGirandoColaborador(true)
    setMostrarResultado(false)

    if (somAtivado) {
      criarSomRoleta()
    }

    aplicarAnimacaoDesaceleracao(roletaColaboradorRef.current, 3000)

    setTimeout(() => {
      const indiceAleatorio = Math.floor(Math.random() * colaboradoresDisponiveis.length)
      setColaboradorSelecionado(colaboradoresDisponiveis[indiceAleatorio])
      setGirandoColaborador(false)
    }, 3000)
  }

  const girarRoletaSala = () => {
    if (!colaboradorSelecionado) {
      alert("Primeiro selecione um colaborador!")
      return
    }

    const salasDisponiveis = obterSalasDisponiveis(colaboradorSelecionado)

    if (salasDisponiveis.length === 0) {
      alert("Não há salas disponíveis para este colaborador!")
      return
    }

    setGirandoSala(true)
    setMostrarResultado(false)

    if (somAtivado) {
      criarSomRoleta()
    }

    aplicarAnimacaoDesaceleracao(roletaSalaRef.current, 3000)

    setTimeout(() => {
      const indiceAleatorio = Math.floor(Math.random() * salasDisponiveis.length)
      const salaEscolhida = salasDisponiveis[indiceAleatorio]
      setSalaSelecionada(salaEscolhida)
      setGirandoSala(false)

      // Atualizar estado das saídas e entradas
      const salaOriginal = encontrarSalaOriginal(colaboradorSelecionado)

      // Incrementar saídas da sala original
      const novasSaidas = { ...saidasRealizadas }
      novasSaidas[salaOriginal]++
      setSaidasRealizadas(novasSaidas)

      // Incrementar entradas da sala de destino
      const novasEntradas = { ...entradasRealizadas }
      novasEntradas[salaEscolhida]++
      setEntradasRealizadas(novasEntradas)

      // Registrar a pessoa como movida
      const novasPessoasMovidas = { ...pessoasMovidas }
      novasPessoasMovidas[colaboradorSelecionado] = salaEscolhida
      setPessoasMovidas(novasPessoasMovidas)

      // Adicionar ao histórico
      setHistoricoSorteios((prev) => [
        ...prev,
        {
          colaborador: colaboradorSelecionado,
          salaOriginal,
          salaDestino: salaEscolhida,
        },
      ])

      setTimeout(() => {}, 500)
    }, 3000)
  }

  const girarAmbas = () => {
    girarRoletaColaborador()

    setTimeout(() => {
      if (colaboradorSelecionado) {
        girarRoletaSala()
      }
    }, 3500)
  }

  const resetarTudo = () => {
    setColaboradorSelecionado("")
    setSalaSelecionada("")
    setMostrarResultado(false)
    setGirandoColaborador(false)
    setGirandoSala(false)
    setSaidasRealizadas({
      "Sala Azul": 0,
      "Sala Roxa": 0,
      "Sala Vermelha": 0,
    })
    setEntradasRealizadas({
      "Sala Azul": 0,
      "Sala Roxa": 0,
      "Sala Vermelha": 0,
    })
    setPessoasMovidas({})
    setHistoricoSorteios([])

    if (roletaColaboradorRef.current) {
      roletaColaboradorRef.current.style.animation = "none"
      roletaColaboradorRef.current.style.transition = "none"
      roletaColaboradorRef.current.style.transform = "rotate(0deg)"
    }
    if (roletaSalaRef.current) {
      roletaSalaRef.current.style.animation = "none"
      roletaSalaRef.current.style.transition = "none"
      roletaSalaRef.current.style.transform = "rotate(0deg)"
    }
  }

  const resetarSorteioAtual = () => {
    setColaboradorSelecionado("")
    setSalaSelecionada("")
    setMostrarResultado(false)
    setGirandoColaborador(false)
    setGirandoSala(false)

    if (roletaColaboradorRef.current) {
      roletaColaboradorRef.current.style.animation = "none"
      roletaColaboradorRef.current.style.transition = "none"
      roletaColaboradorRef.current.style.transform = "rotate(0deg)"
    }
    if (roletaSalaRef.current) {
      roletaSalaRef.current.style.animation = "none"
      roletaSalaRef.current.style.transition = "none"
      roletaSalaRef.current.style.transform = "rotate(0deg)"
    }
  }

  const colaboradoresDisponiveis = obterColaboradoresDisponiveis()
  const salasDisponiveisParaColaborador = colaboradorSelecionado ? obterSalasDisponiveis(colaboradorSelecionado) : salas

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo-andcont.png" alt="AndCont Logo" width={300} height={80} className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
             Mistureba AndCont
          </h1>
          <p className="text-gray-600">
            O Mistureba é um movimento interno que acontecerá toda quinta-feira, com o propósito de misturar as pessoas literalmente!
          </p>

          {/* Controles */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={() => setSomAtivado(!somAtivado)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {somAtivado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {somAtivado ? "Som Ativado" : "Som Desativado"}
            </Button>

            <Button
              onClick={() => setMostrarRegras(!mostrarRegras)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              {mostrarRegras ? "Ocultar Regras" : "Ver Regras"}
            </Button>
          </div>
        </div>

        {/* Regras */}
        {mostrarRegras && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 text-blue-800">📋 Regras do Sorteio</h3>

              <div className="mb-4">
                <h4 className="font-semibold text-blue-700 mb-2">Composição Inicial das Salas:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(composicaoInicial).map(([sala, pessoas]) => (
                    <div key={sala} className="bg-white p-3 rounded border">
                      <div
                        className={`font-semibold mb-2 ${
                          sala === "Sala Azul"
                            ? "text-blue-600"
                            : sala === "Sala Roxa"
                              ? "text-purple-600"
                              : "text-red-600"
                        }`}
                      >
                        {sala}:
                      </div>
                      <ul className="text-gray-700">
                        {pessoas.map((pessoa) => (
                          <li key={pessoa}>• {pessoa}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <strong>1. Limite de Trocas por Sala:</strong>
                  <ul className="ml-4 mt-1">
                    <li>• Sala Azul: saem 2 pessoas, entram 2</li>
                    <li>• Sala Roxa: saem 2 pessoas, entram 2</li>
                    <li>• Sala Vermelha: sai 1 pessoa, entram 2 (de salas diferentes)</li>
                  </ul>
                </div>

                <div>
                  <strong>2. Regra de Repetição:</strong>
                  <p className="ml-4 mt-1">Ninguém pode ser sorteado para a mesma sala onde já está.</p>
                </div>

                <div>
                  <strong>3. Regra de Convivência:</strong>
                  <p className="ml-4 mt-1">
                    Duas pessoas que já estão na mesma sala não podem cair juntas em uma nova sala.
                  </p>
                </div>

                <div>
                  <strong>4. Regra Especial da Sala Vermelha:</strong>
                  <p className="ml-4 mt-1">
                    A Sala Vermelha pode receber até 2 pessoas, mas elas devem ser de salas diferentes (uma da Sala Azul
                    e uma da Sala Roxa).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status das Trocas */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Status das Trocas</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {salas.map((sala) => {
                const limiteSaidas = limitesTrocas[sala as keyof typeof limitesTrocas].saem
                const limiteEntradas = limitesTrocas[sala as keyof typeof limitesTrocas].entram
                const saidasRealizadasSala = saidasRealizadas[sala]
                const entradasRealizadasSala = entradasRealizadas[sala]

                return (
                  <div key={sala} className="text-center">
                    <div
                      className={`font-semibold mb-2 ${
                        sala === "Sala Azul"
                          ? "text-blue-600"
                          : sala === "Sala Roxa"
                            ? "text-purple-600"
                            : "text-red-600"
                      }`}
                    >
                      {sala}
                    </div>

                    <div className="space-y-2">
                      {/* Saídas */}
                      <div>
                        <div className="text-sm text-gray-600">Saídas</div>
                        <div className="text-xl font-bold">
                          {saidasRealizadasSala}/{limiteSaidas}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              sala === "Sala Azul"
                                ? "bg-blue-500"
                                : sala === "Sala Roxa"
                                  ? "bg-purple-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${(saidasRealizadasSala / limiteSaidas) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Entradas */}
                      <div>
                        <div className="text-sm text-gray-600">Entradas</div>
                        <div className="text-xl font-bold">
                          {entradasRealizadasSala}/{limiteEntradas}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full opacity-60 ${
                              sala === "Sala Azul"
                                ? "bg-blue-500"
                                : sala === "Sala Roxa"
                                  ? "bg-purple-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${(entradasRealizadasSala / limiteEntradas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Roleta de Colaboradores */}
          <Card className="relative overflow-hidden shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-pink-500 to-pink-600 text-white">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                Colaboradores Disponíveis ({colaboradoresDisponiveis.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <div
                  ref={roletaColaboradorRef}
                  className="w-64 h-64 mx-auto border-8 border-pink-500 rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "conic-gradient(from 0deg, #ec4899, #f97316, #ef4444, #8b5cf6, #3b82f6, #ec4899)",
                  }}
                >
                  <div className="w-56 h-56 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      {girandoColaborador ? (
                        <div className="animate-pulse">
                          <div className="text-3xl mb-2">🎲</div>
                          <div className="text-sm text-gray-500 font-semibold">Girando...</div>
                          <div className="w-8 h-1 bg-pink-500 rounded-full mx-auto mt-2 animate-pulse"></div>
                        </div>
                      ) : colaboradorSelecionado ? (
                        <div className="animate-bounce">
                          <div className="text-lg font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-1">
                            Sorteado:
                          </div>
                          <div className="text-xl font-semibold text-gray-800">{colaboradorSelecionado}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Sala atual: {encontrarSalaOriginal(colaboradorSelecionado)}
                          </div>
                          <div className="text-2xl mt-2">🎉</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-2" />
                          <div>Clique para girar</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de colaboradores disponíveis */}
                <div className="mt-4 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {colaboradoresDisponiveis.map((colaborador, index) => (
                      <Badge
                        key={index}
                        variant={colaborador === colaboradorSelecionado ? "default" : "secondary"}
                        className={`justify-center transition-all duration-300 ${
                          colaborador === colaboradorSelecionado
                            ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                            : ""
                        }`}
                      >
                        {colaborador}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={girarRoletaColaborador}
                disabled={girandoColaborador || colaboradoresDisponiveis.length === 0}
                className="w-full mt-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-4 h-4 mr-2" />
                {girandoColaborador ? "Girando..." : "Girar Roleta"}
              </Button>
            </CardContent>
          </Card>

          {/* Roleta de Salas */}
          <Card className="relative overflow-hidden shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center justify-center gap-2">
                <MapPin className="w-6 h-6" />
                Salas Disponíveis ({salasDisponiveisParaColaborador.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <div
                  ref={roletaSalaRef}
                  className="w-64 h-64 mx-auto border-8 border-orange-500 rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "conic-gradient(from 0deg, #ef4444, #8b5cf6, #3b82f6, #ef4444, #8b5cf6, #3b82f6)",
                  }}
                >
                  <div className="w-56 h-56 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      {girandoSala ? (
                        <div className="animate-pulse">
                          <div className="text-3xl mb-2">🎲</div>
                          <div className="text-sm text-gray-500 font-semibold">Girando...</div>
                          <div className="w-8 h-1 bg-orange-500 rounded-full mx-auto mt-2 animate-pulse"></div>
                        </div>
                      ) : salaSelecionada ? (
                        <div className="animate-bounce">
                          <div className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-1">
                            Sorteada:
                          </div>
                          <div className="text-xl font-semibold text-gray-800">{salaSelecionada}</div>
                          <div className="text-2xl mt-2">🎉</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <MapPin className="w-12 h-12 mx-auto mb-2" />
                          <div>Clique para girar</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de salas disponíveis */}
                <div className="mt-4 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {salasDisponiveisParaColaborador.map((sala, index) => {
                      let salaColor = ""
                      if (sala === "Sala Vermelha") salaColor = "bg-red-500 text-white"
                      else if (sala === "Sala Roxa") salaColor = "bg-purple-500 text-white"
                      else if (sala === "Sala Azul") salaColor = "bg-blue-500 text-white"

                      return (
                        <Badge
                          key={index}
                          variant={sala === salaSelecionada ? "default" : "secondary"}
                          className={`justify-center transition-all duration-300 ${
                            sala === salaSelecionada ? salaColor : ""
                          }`}
                        >
                          {sala}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>

              <Button
                onClick={girarRoletaSala}
                disabled={girandoSala || !colaboradorSelecionado || salasDisponiveisParaColaborador.length === 0}
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-4 h-4 mr-2" />
                {girandoSala ? "Girando..." : "Girar Roleta"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Controles principais */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={girarAmbas}
            disabled={girandoColaborador || girandoSala || colaboradoresDisponiveis.length === 0}
            size="lg"
            className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Play className="w-5 h-5 mr-2" />
            Girar Ambas as Roletas
          </Button>

          <Button
            onClick={resetarSorteioAtual}
            variant="outline"
            size="lg"
            className="border-pink-300 text-pink-600 hover:bg-pink-50 bg-transparent transition-all duration-300 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Novo Sorteio
          </Button>

          <Button
            onClick={resetarTudo}
            variant="destructive"
            size="lg"
            className="transition-all duration-300 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Resetar Tudo
          </Button>
        </div>

        {/* Histórico de Sorteios */}
        {historicoSorteios.length > 0 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">📋 Histórico de Sorteios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {historicoSorteios.map((sorteio, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-semibold">{sorteio.colaborador}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{sorteio.salaOriginal}</span>
                      <span>→</span>
                      <span
                        className={`font-semibold ${
                          sorteio.salaDestino === "Sala Azul"
                            ? "text-blue-600"
                            : sorteio.salaDestino === "Sala Roxa"
                              ? "text-purple-600"
                              : "text-red-600"
                        }`}
                      >
                        {sorteio.salaDestino}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
