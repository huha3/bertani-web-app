export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await fetch("http://127.0.0.1:5000/api/model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(text, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)

  } catch (error) {
    return Response.json(
      { error: "Gagal memanggil model" },
      { status: 500 }
    )
  }
}
