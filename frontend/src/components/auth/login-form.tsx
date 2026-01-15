"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"

function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  try {
    api.post<Data>("/users/login", {
      name: (event.currentTarget.elements.namedItem("name") as HTMLInputElement)?.value,
      lastname: (event.currentTarget.elements.namedItem("lastname") as HTMLInputElement)?.value,
      email: (event.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value,
      pwd: (event.currentTarget.elements.namedItem("password") as HTMLInputElement)?.value,
      pwd2: (event.currentTarget.elements.namedItem("password2") as HTMLInputElement)?.value,
    }).then((data) => {
      toast.success("Login successful!")
      // add cookie
      document.cookie = `token=${data.access_token}; path=/; max-age=3600;`
      window.location.href = "/" // Redirect to the dashboard or another page
    }).catch((error) => {
      // Handle login error, e.g., show an error message
      toast.error("Error during login: " + error)
    })
  } catch (error) {
    console.error("Error during log:", error)
  }
  event.preventDefault() // Prevent the default form submission
}

function handleSignup(event: React.FormEvent<HTMLFormElement>) {
  try {
    api.post<Data>("/users/register", {
      name: (event.currentTarget.elements.namedItem("name") as HTMLInputElement)?.value,
      lastname: (event.currentTarget.elements.namedItem("lastname") as HTMLInputElement)?.value,
      email: (event.currentTarget.elements.namedItem("email") as HTMLInputElement)?.value,
      pwd: (event.currentTarget.elements.namedItem("password") as HTMLInputElement)?.value,
      pwd2: (event.currentTarget.elements.namedItem("password2") as HTMLInputElement)?.value,
    }).then((data) => {
      document.cookie = `token=${data.access_token}; path=/; max-age=3600;`
      window.location.href = "/" // Redirect to the dashboard or another page
    }).catch((error) => {
      // Handle signup error, e.g., show an error message
      toast.error("Error during signup: " + error.message)
    })
  } catch (error) {
    console.error("Error during signup:", error)
  }
  event.preventDefault() // Prevent the default form submission
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const [signup, setSignup] = React.useState(false)

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={signup ? handleSignup : handleLogin} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        {signup ? (<h1 className="text-2xl font-bold">Create your account</h1>) : (<h1 className="text-2xl font-bold">Login to your account</h1>)}
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        {signup ? (
          <>
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lastname">Last Name</Label>
              <Input id="lastname" type="text" placeholder="Doe" required />
            </div>
          </>
        ) : null}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            {/* <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a> */}
          </div>
          <Input id="password" type="password" required />
          {signup ? (<div className="grid gap-3">
            <Label htmlFor="password2">Confirm Password</Label>
            <Input id="password2" type="password" required />
          </div>) : null}
        </div>
        <Button type="submit" className="w-full">
          { signup ? (<><span>Sign up</span></>) : (<><span>Login</span></>)}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or
          </span>
        </div>
      </div>
      <div className="text-center text-sm flex justify-center">
        <p className="mr-2">Don&apos;t have an account?</p>
          { signup ? (
            <p className="underline underline-offset-4 cursor-pointer hover:text-primary" onClick={() => setSignup(!signup)}>
              Log in
            </p>
          ) : (
            <p className="underline underline-offset-4 cursor-pointer hover:text-primary" onClick={() => setSignup(!signup)}>
              Sign up
            </p>
          )}
      </div>
    </form>
  )
}
