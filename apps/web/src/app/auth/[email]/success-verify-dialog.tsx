"use client";

import Image from "next/image";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";

type SuccessVerifyDialogProps = {
  isOpen: boolean;
  onRedirect: () => void;
};

export function SuccessVerifyDialog({
  isOpen,
  onRedirect,
}: SuccessVerifyDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-xs md:max-w-97 md:h-66 flex flex-col justify-around">
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Image
            src="/assets/success-check.png"
            alt="success dialog icon"
            width={40}
            height={40}
          />
        </div>

        <div className="px-6 text-center">
          <h3 className="text-primary text-[20px] font-semibold  my-4">
            Seu email foi vericado!
          </h3>
          <span className="text-center text-base">
            <strong>Pronto!</strong> Agora você já pode acessar <br />
            sua conta na <strong>plataforma VERACIS</strong>
          </span>
        </div>

        <AlertDialogFooter className=" justify-center">
          <Button variant="outline" onClick={onRedirect}>
            Concluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
      {/*<AlertDialogContent className="w-96">
        <div className="absolute left-1/2 -translate-x-1/2 -top-4">
          <Image src={SuccessCheckPNG} alt="success dialog icon" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center font-semibold mt-8 mb-2 text-blue-900">
            Seu email foi vericado!
          </AlertDialogTitle>
          <AlertDialogDescription />
          <span className="text-center font-sans">
            <span className="font-semibold ">Pronto!</span> Agora você já pode
            acessar <br /> sua conta na{' '}
            <span className="font-semibold ">plataforma VERACIS</span>
          </span>

          <Button
            variant="outline"
            className="w-40 rounded-full border border-blue-900 text-blue-900 self-center mt-4 font-sans hover:bg-blue-50 hover:text-blue-800 hover:cursor-pointer"
            onClick={onRedirect}
          >
            Concluir
          </Button>
        </AlertDialogHeader>
      </AlertDialogContent>*/}
    </AlertDialog>
  );
}
