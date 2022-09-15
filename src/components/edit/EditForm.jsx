import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import Modal from "components/layout/Modal";
import Button from "components/elements/Button";
import Input from "components/elements/Input";
import SelectBox from "components/elements/SelectBox";
import Textarea from "components/elements/Textarea";
import ImageNumAlert from "components/form/ImageNumAlert";
import ImageAlert from "components/form/ImageAlert";
import LoadingMessage from "components/etc/LoadingMessage";
import { getDetailCheck } from "api/detailApi";
import { patchDetailCheck } from "api/editApi";
import handlePrice from "utils/handlePrice";
import { colors } from "styles/theme";
import { a11yHidden } from "styles/mixin";
import icons from "assets";

const EditForm = () => {
  const [files, setFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [editText, setEditText] = useState({
    category: "",
    title: "",
    price: "",
    content: "",
  });
  const [previewCategory, setPreviewCategory] = useState("");
  const [previewPrice, setPreviewPrice] = useState("");
  /* IMAGE ALERT -------------------------------------------------------------- */
  const [openImageAlert, setOpenImageAlert] = useState(false);
  const [openImageNumberAlert, setOpenImageNumberAlert] = useState(false);
  /* VALIDATION : TITLE, PRICE, CONTENT --------------------------------------- */
  const [isValidTitle, setIsValidTitle] = useState(true);
  const [isValidPrice, setIsValidPrice] = useState(true);
  const [isValidContent, setIsValidContent] = useState(true);

  const MAX_IMG_SIZE = 20000000;
  const MAX_TITLE_LENGTH = 30;
  const MAX_CONTENT_LENGTH = 400;

  const navigate = useNavigate();
  const { id } = useParams();
  const { IconPlus, IconX } = icons;

  const selectboxData = [
    { key: 1, value: "디지털/생활가전", category: "digital" },
    { key: 2, value: "의류/잡화", category: "clothes" },
    { key: 3, value: "스포츠/레저", category: "sports" },
    { key: 4, value: "가구/인테리어", category: "interior" },
    { key: 5, value: "도서/여행/취미", category: "hobby" },
    { key: 6, value: "반려동물/식물", category: "pet" },
    { key: 7, value: "식품", category: "food" },
    { key: 8, value: "기타", category: "etc" },
  ];

  const queryClient = useQueryClient();

  const { isLoading, data, refetch, isSuccess } = useQuery(
    "detailCheckEdit",
    () => getDetailCheck(id),
    {
      onSuccess: (data) => {
        const { category } = selectboxData.find(
          (val) => val.value === data.data.category
        );
        setEditText({
          ...editText,
          category: category,
          title: data.data.title,
          price: data.data.price.replaceAll(",", ""),
          content: data.data.content,
        });
        setPreviewFiles([...data.data.images]);
        setPreviewCategory(data.data.category);
        setPreviewPrice(data.data.price);
      },
      staleTime: 50000,
      enabled: false,
    }
  );

  const { mutate: patchMutate } = useMutation(patchDetailCheck, {
    onSuccess: (data) => {
      queryClient.invalidateQueries("detailCheck");
    },
  });

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading) return <LoadingMessage />;

  if (isSuccess) {
    const { createdAt, images } = data?.data;

    /* 이미지 편집 ------------------------------------------------------------------- */
    const handleAddImages = (e) => {
      if (previewFiles.length + [...e.target.files].length > 5)
        return setOpenImageNumberAlert(true);

      [...e.target.files].map((item) => {
        if (item.size > MAX_IMG_SIZE) return setOpenImageAlert(true);
        const reader = new FileReader();
        reader.readAsDataURL(item);
        reader.onload = () =>
          setPreviewFiles((previewFiles) => [...previewFiles, reader.result]);
      });
      setFiles([...files, ...e.target.files]);
    };

    const handleDeleteImage = (image, id) => {
      images.includes(image)
        ? setDeletedFiles([...deletedFiles, image])
        : setFiles(files.filter((file, index) => index !== id));
      setPreviewFiles(previewFiles.filter((file, index) => index !== id));
    };

    /* 카테고리 선택 ------------------------------------------------------------------ */
    const handleChangeSelectbox = (e) => {
      const { category } = selectboxData.find(
        (val) => val.value === e.target.innerText
      );
      setPreviewCategory(e.target.innerText);
      setEditText({ ...editText, category: category });
    };

    /* 제목, 가격, 내용 편집 ------------------------------------------------------------ */
    const handleChange = (e) => {
      const { name, value } = e.target;

      if (name === "price") {
        const { isValid, realPrice, previewPrice } = handlePrice(value);
        if (value.length === 0) {
          setEditText({ ...editText, price: "" });
          setPreviewPrice("");
        } else {
          if (isValid) {
            setIsValidPrice(true);
            setEditText({ ...editText, price: realPrice });
            setPreviewPrice(previewPrice);
          }
        }
      }

      if (name === "title") {
        setIsValidTitle(true);
        if (value.length > MAX_TITLE_LENGTH) return;
        setEditText((editText) => ({ ...editText, title: value }));
      }

      if (name === "content") {
        setIsValidContent(true);
        if (value.length > MAX_CONTENT_LENGTH) return;
        setEditText((editText) => ({ ...editText, content: value }));
      }
    };

    /* SUBMIT EDIT FORM --------------------------------------------------------- */
    const handleSubmit = (e) => {
      e.preventDefault();

      !editText.title.trim().length && setIsValidTitle(false);
      !editText.price.trim().length && setIsValidPrice(false);
      !editText.content.trim().length && setIsValidContent(false);

      if (
        editText.title.trim().length &&
        editText.price.trim().length &&
        editText.content.trim().length
      ) {
        const textData = {
          ...editText,
          imageList: deletedFiles,
          price: editText.price.replaceAll(",", ""),
        };

        let formData = new FormData();
        files.map((file) => formData.append("multipartFile", file));
        formData.append(
          "articlesDto",
          new Blob([JSON.stringify(textData)], { type: "application/json" })
        );

        const payload = {
          articlesId: id,
          data: formData,
        };

        patchMutate(payload);
        navigate(`/detail/${id}`);
      }
    };

    return (
      <StEditForm onSubmit={handleSubmit}>
        <StImageContainer>
          <StTime>
            <span>{createdAt}</span>
          </StTime>
          <StImage>
            <img alt="detailcheck" src={images[0]} />
          </StImage>
          <StPreview>
            <label htmlFor="input-file" onChange={handleAddImages}>
              <IconPlus />
              <input
                className="a11y-hidden"
                type="file"
                id="input-file"
                multiple
              />
            </label>
            <StImages>
              <StImagesList>
                {previewFiles.length === 0 ? (
                  <p>사진을 등록해 주세요.</p>
                ) : (
                  <>
                    {previewFiles.map((image, id) => {
                      return (
                        <StPreviewImage key={image}>
                          <Button
                            variant="image"
                            onClickHandler={() => handleDeleteImage(image, id)}
                          >
                            <IconX stroke={colors.white} />
                          </Button>
                          <img
                            alt="detailcheck preview"
                            src={image}
                            key={image}
                          />
                        </StPreviewImage>
                      );
                    })}
                  </>
                )}
              </StImagesList>
            </StImages>
            {openImageAlert && (
              <Modal handleOpenModal={() => setOpenImageAlert(false)}>
                <ImageAlert handleOpenModal={() => setOpenImageAlert(false)} />
              </Modal>
            )}
            {openImageNumberAlert && (
              <Modal handleOpenModal={() => setOpenImageNumberAlert(false)}>
                <ImageNumAlert
                  handleOpenModal={() => setOpenImageNumberAlert(false)}
                />
              </Modal>
            )}
          </StPreview>
        </StImageContainer>
        <StTextContainer>
          <SelectBox
            data={selectboxData}
            currentValue={previewCategory}
            handleOnChangeSelectValue={handleChangeSelectbox}
          />
          <StText isValid={isValidTitle}>
            <Input
              theme="grey"
              placeholder="제목을 입력해 주세요."
              onChangeHandler={handleChange}
              name="title"
              value={editText.title}
            />
          </StText>
          <StPrice isValid={isValidPrice}>
            <Input
              theme="grey"
              placeholder="가격을 입력해 주세요."
              onChangeHandler={handleChange}
              value={previewPrice}
              name="price"
            />
            {previewPrice.trim().length ? <span>원</span> : null}
          </StPrice>
          <StText isValid={isValidContent}>
            <Textarea
              onChangeHandler={handleChange}
              value={editText.content}
              name="content"
            />
            <p>*15글자 이상 입력해 주세요.</p>
          </StText>
        </StTextContainer>
        <StButton>
          <StCancelBtn>
            <Button
              size="large_round"
              theme="grey"
              onClickHandler={() => navigate(`/detail/${id}`)}
            >
              취소
            </Button>
          </StCancelBtn>
          <Button size="large_round" type="submit">
            전송하기
          </Button>
        </StButton>
      </StEditForm>
    );
  }
};

const StEditForm = styled.form`
  position: relative;
  top: 64px;
`;

const StImageContainer = styled.div`
  position: relative;
`;

const StTime = styled.div`
  position: absolute;
  top: 8px;
  right: 18px;
  z-index: 11;
  color: ${colors.grey3};
  font-family: "Roboto", "Noto Sans KR", sans-serif;
  font-size: 12px;
`;

const StImage = styled.div`
  width: 100%;
  height: 230px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  height: 70px;
  margin-top: -90px;
  padding-left: 35px;

  .a11y-hidden {
    ${a11yHidden}
  }
`;

const StImages = styled.div`
  overflow: scroll;
`;

const StImagesList = styled.div`
  display: flex;
  gap: 4px;

  p {
    color: ${colors.red};
  }
`;

const StPreviewImage = styled.div`
  width: 100%;
  position: relative;

  img {
    width: 70px;
    height: 70px;
    object-fit: cover;
  }

  button {
    background: rgba(0, 0, 0, 0.3);
    position: absolute;
    top: 0;
    right: 0;
    z-index: 11;
  }
`;

const StTextContainer = styled.div`
  padding: 40px 35px 0 35px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StText = styled.div`
  input {
    ::placeholder {
      color: ${({ isValid }) =>
        isValid ? `${colors.grey3}` : `${colors.red}`};
    }
    border-color: ${({ isValid }) =>
      isValid ? `${colors.grey3}` : `${colors.red}`};
  }

  span {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    color: ${colors.grey3};
  }

  textarea {
    border-color: ${({ isValid }) =>
      isValid ? `${colors.grey3}` : `${colors.red}`};
  }

  p {
    color: ${({ isValid }) => (isValid ? `${colors.grey3}` : `${colors.red}`)};
    font-size: 12px;
    text-align: right;
  }
`;

const StPrice = styled.div`
  position: relative;

  input {
    ::placeholder {
      color: ${({ isValid }) =>
        isValid ? `${colors.grey3}` : `${colors.red}`};
    }
    border-color: ${({ isValid }) =>
      isValid ? `${colors.grey3}` : `${colors.red}`};
  }

  span {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    color: ${colors.grey3};
  }
`;

const StButton = styled.div`
  display: flex;
  position: fixed;
  bottom: 30px;
  padding: 0 35px;
  width: 100%;
  gap: 10px;
`;

const StCancelBtn = styled.div`
  min-width: 100px;
`;

export default EditForm;