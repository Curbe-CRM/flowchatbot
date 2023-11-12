--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

-- Started on 2023-11-12 10:24:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4838 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16528)
-- Name: conversacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversacion (
    conv_usuario bigint NOT NULL,
    conv_fecha timestamp without time zone NOT NULL,
    conv_id bigint NOT NULL,
    conv_princ_menu_opc bigint,
    conv_sucursal bigint,
    conv_moto bigint,
    conv_tipo_repuesto character varying,
    conv_moto_anio bigint,
    conv_celular character varying,
    conv_tipo_moto bigint,
    conv_finalizada boolean DEFAULT false,
    conv_ciudad character varying,
    conv_tiempo_compra bigint,
    conv_mutable boolean DEFAULT false
);


ALTER TABLE public.conversacion OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16548)
-- Name: conversacion_conv_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversacion_conv_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversacion_conv_id_seq OWNER TO postgres;

--
-- TOC entry 4839 (class 0 OID 0)
-- Dependencies: 222
-- Name: conversacion_conv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversacion_conv_id_seq OWNED BY public.conversacion.conv_id;


--
-- TOC entry 226 (class 1259 OID 16566)
-- Name: empresa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresa (
    emp_nombre character varying,
    emp_id bigint NOT NULL,
    emp_num_whtsp character varying
);


ALTER TABLE public.empresa OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16565)
-- Name: empresa_emp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empresa_emp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empresa_emp_id_seq OWNER TO postgres;

--
-- TOC entry 4840 (class 0 OID 0)
-- Dependencies: 225
-- Name: empresa_emp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empresa_emp_id_seq OWNED BY public.empresa.emp_id;


--
-- TOC entry 217 (class 1259 OID 16531)
-- Name: mensaje; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mensaje (
    msj_contenido character varying,
    msj_conv_id bigint NOT NULL,
    msj_id bigint NOT NULL,
    msj_nodo_flujo real NOT NULL,
    msj_flujo_padre real
);


ALTER TABLE public.mensaje OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16555)
-- Name: mensaje_msj_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mensaje_msj_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mensaje_msj_id_seq OWNER TO postgres;

--
-- TOC entry 4841 (class 0 OID 0)
-- Dependencies: 223
-- Name: mensaje_msj_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mensaje_msj_id_seq OWNED BY public.mensaje.msj_id;


--
-- TOC entry 228 (class 1259 OID 16595)
-- Name: sec_apl_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_apl_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_apl_id OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16537)
-- Name: sec_conv_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_conv_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_conv_id OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16564)
-- Name: sec_emp_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_emp_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_emp_id OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16538)
-- Name: sec_msj_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_msj_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_msj_id OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16579)
-- Name: sec_tip_msj; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_tip_msj
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_tip_msj OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16536)
-- Name: sec_usu_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sec_usu_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sec_usu_id OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16523)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    usu_nombre character varying,
    usu_apellido character varying,
    usu_celular character varying NOT NULL,
    usu_correo character varying,
    usu_ciudad bigint,
    usu_identificador character varying,
    usu_id bigint NOT NULL,
    usu_emp_id bigint,
    usu_opcion_identificador boolean,
    usu_estado_civil bigint,
    usu_term_acept boolean
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16539)
-- Name: usuario_usu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_usu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_usu_id_seq OWNER TO postgres;

--
-- TOC entry 4842 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuario_usu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_usu_id_seq OWNED BY public.usuario.usu_id;


--
-- TOC entry 4656 (class 2604 OID 16549)
-- Name: conversacion conv_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversacion ALTER COLUMN conv_id SET DEFAULT nextval('public.conversacion_conv_id_seq'::regclass);


--
-- TOC entry 4660 (class 2604 OID 16569)
-- Name: empresa emp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa ALTER COLUMN emp_id SET DEFAULT nextval('public.empresa_emp_id_seq'::regclass);


--
-- TOC entry 4659 (class 2604 OID 16556)
-- Name: mensaje msj_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje ALTER COLUMN msj_id SET DEFAULT nextval('public.mensaje_msj_id_seq'::regclass);


--
-- TOC entry 4655 (class 2604 OID 16540)
-- Name: usuario usu_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN usu_id SET DEFAULT nextval('public.usuario_usu_id_seq'::regclass);


--
-- TOC entry 4820 (class 0 OID 16528)
-- Dependencies: 216
-- Data for Name: conversacion; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4830 (class 0 OID 16566)
-- Dependencies: 226
-- Data for Name: empresa; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.empresa VALUES ('local', 1, '0912345678');


--
-- TOC entry 4821 (class 0 OID 16531)
-- Dependencies: 217
-- Data for Name: mensaje; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4819 (class 0 OID 16523)
-- Dependencies: 215
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4843 (class 0 OID 0)
-- Dependencies: 222
-- Name: conversacion_conv_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversacion_conv_id_seq', 22, true);


--
-- TOC entry 4844 (class 0 OID 0)
-- Dependencies: 225
-- Name: empresa_emp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresa_emp_id_seq', 1, true);


--
-- TOC entry 4845 (class 0 OID 0)
-- Dependencies: 223
-- Name: mensaje_msj_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mensaje_msj_id_seq', 1, true);


--
-- TOC entry 4846 (class 0 OID 0)
-- Dependencies: 228
-- Name: sec_apl_id; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_apl_id', 1, false);


--
-- TOC entry 4847 (class 0 OID 0)
-- Dependencies: 219
-- Name: sec_conv_id; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_conv_id', 1, false);


--
-- TOC entry 4848 (class 0 OID 0)
-- Dependencies: 224
-- Name: sec_emp_id; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_emp_id', 1, false);


--
-- TOC entry 4849 (class 0 OID 0)
-- Dependencies: 220
-- Name: sec_msj_id; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_msj_id', 1, false);


--
-- TOC entry 4850 (class 0 OID 0)
-- Dependencies: 227
-- Name: sec_tip_msj; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_tip_msj', 1, false);


--
-- TOC entry 4851 (class 0 OID 0)
-- Dependencies: 218
-- Name: sec_usu_id; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sec_usu_id', 1, false);


--
-- TOC entry 4852 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuario_usu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_usu_id_seq', 30, true);


--
-- TOC entry 4662 (class 2606 OID 16623)
-- Name: usuario celular_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT celular_unique UNIQUE (usu_celular);


--
-- TOC entry 4666 (class 2606 OID 16554)
-- Name: conversacion conversacion_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversacion
    ADD CONSTRAINT conversacion_pk PRIMARY KEY (conv_id);


--
-- TOC entry 4668 (class 2606 OID 16625)
-- Name: conversacion conversacion_un; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversacion
    ADD CONSTRAINT conversacion_un UNIQUE (conv_usuario);


--
-- TOC entry 4672 (class 2606 OID 16573)
-- Name: empresa empresa_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pk PRIMARY KEY (emp_id);


--
-- TOC entry 4670 (class 2606 OID 16563)
-- Name: mensaje mensaje_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT mensaje_pk PRIMARY KEY (msj_id);


--
-- TOC entry 4664 (class 2606 OID 16547)
-- Name: usuario usuario_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pk PRIMARY KEY (usu_id);


--
-- TOC entry 4674 (class 2606 OID 16610)
-- Name: conversacion conv_usu_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversacion
    ADD CONSTRAINT conv_usu_fk FOREIGN KEY (conv_usuario) REFERENCES public.usuario(usu_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4673 (class 2606 OID 16574)
-- Name: usuario emp_usu_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT emp_usu_id_fk FOREIGN KEY (usu_emp_id) REFERENCES public.empresa(emp_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4675 (class 2606 OID 16615)
-- Name: mensaje msj_conv_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensaje
    ADD CONSTRAINT msj_conv_fk FOREIGN KEY (msj_conv_id) REFERENCES public.conversacion(conv_id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2023-11-12 10:24:54

--
-- PostgreSQL database dump complete
--

